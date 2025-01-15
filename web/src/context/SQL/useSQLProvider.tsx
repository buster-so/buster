import React, { useRef, useState } from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import {
  BusterMessageData,
  IBusterThreadMessage,
  useBusterThreadsContextSelector
} from '../Threads';
import {
  createContext,
  useContextSelector,
  ContextSelector
} from '@fluentui/react-context-selector';
import type { IBusterThreadMessageChartConfig } from '@/api/buster-rest/threads';
import { useBusterMessageDataContextSelector } from '../MessageData';
import { useBusterNotifications } from '../BusterNotifications';
import { didColumnDataChange, simplifyChratConfigForSQLChange } from './helpers';
import { ThreadUpdateMessage } from '@/api/buster-socket/threads';
import { timeout } from '@/utils';
import { RunSQLResponse } from '@/api/buster-rest/sql/responseInterfaces';

export const useSQLProvider = () => {
  const busterSocket = useBusterWebSocket();
  const { openSuccessNotification } = useBusterNotifications();
  const onUpdateThreadMessage = useBusterThreadsContextSelector((x) => x.onUpdateThreadMessage);
  const onSetMessageData = useBusterMessageDataContextSelector((x) => x.onSetMessageData);
  const getMessageData = useBusterMessageDataContextSelector((x) => x.getMessageData);
  const updateThreadMessageToServer = useBusterThreadsContextSelector(
    (x) => x.updateThreadMessageToServer
  );
  const getThreadMessage = useBusterThreadsContextSelector(
    (x) => x.getThreadMessageNotLiveDataMethodOnly
  );
  const onSaveThreadChanges = useBusterThreadsContextSelector((x) => x.onSaveThreadChanges);

  const [warnBeforeNavigating, setWarnBeforeNavigating] = useState(false);

  const [resetTrigger, setResetTrigger] = useState<number>(0); //this is used to reset the original configs when the thread is reset. It's a hack used in useDisableSaveChanges.tsx

  const originalConfigs = useRef<
    Record<
      string,
      {
        chartConfig: IBusterThreadMessageChartConfig;
        code: string;
        data: BusterMessageData['data'];
        dataMetadata: BusterMessageData['data_metadata'];
      }
    >
  >({});

  const _onResponseRunSQL = useMemoizedFn(
    (
      d: RunSQLResponse,
      sql: string,
      { messageId, threadId }: { messageId?: string; threadId?: string }
    ) => {
      if (messageId && threadId) {
        const { data, data_metadata } = d;
        const threadMessage = getThreadMessage({ threadId, messageId });
        const currentMessageData = getMessageData(messageId);
        if (!originalConfigs.current[messageId]) {
          originalConfigs.current[messageId] = {
            chartConfig: threadMessage?.chart_config!,
            code: currentMessageData?.code!,
            data: currentMessageData?.data!,
            dataMetadata: currentMessageData?.data_metadata!
          };
        }

        const oldColumnData = threadMessage.data_metadata?.column_metadata;
        const newColumnData = data_metadata?.column_metadata;

        const didDataMetadataChange = didColumnDataChange(oldColumnData, newColumnData);

        const totallyDefaultChartConfig: IBusterThreadMessageChartConfig = didDataMetadataChange
          ? simplifyChratConfigForSQLChange(threadMessage.chart_config, data_metadata)
          : threadMessage.chart_config;

        onSetMessageData({
          messageId,
          data,
          isDataFromRerun: true,
          data_metadata,
          code: sql
        });
        onUpdateThreadMessage({
          threadId,
          messageId,
          message: {
            chart_config: totallyDefaultChartConfig
          }
        });
      }

      return d;
    }
  );

  const runSQL = useMemoizedFn(
    async ({
      datasetId,

      sql,
      messageId,
      threadId
    }: {
      messageId?: string;
      datasetId: string;
      threadId?: string;
      sql: string;
    }) => {
      return new Promise<RunSQLResponse>((resolve, reject) => {
        busterSocket.emitAndOnce({
          emitEvent: {
            route: '/sql/run',
            payload: {
              dataset_id: datasetId,
              sql
            }
          },
          responseEvent: {
            route: '/sql/run:runSql',
            callback: (d) => {
              const res = _onResponseRunSQL(d, sql, { messageId, threadId });
              resolve(res);
            },
            onError: reject
          }
        });
      });
    }
  );

  const resetRunSQLData = useMemoizedFn(
    ({ messageId, threadId }: { messageId: string; threadId: string }) => {
      setWarnBeforeNavigating(false);

      if (!originalConfigs.current[messageId]) return;
      const oldConfig = originalConfigs.current[messageId]?.chartConfig;
      onUpdateThreadMessage({
        threadId,
        messageId,
        message: {
          chart_config: oldConfig
        }
      });
      onSetMessageData({
        messageId,
        data: originalConfigs.current[messageId]?.data!,
        data_metadata: originalConfigs.current[messageId]?.dataMetadata!,
        code: originalConfigs.current[messageId]?.code!,
        isDataFromRerun: false
      });
      delete originalConfigs.current[messageId];
    }
  );

  const saveSQL = useMemoizedFn(
    async ({ messageId, threadId, sql }: { messageId: string; threadId: string; sql: string }) => {
      const ogConfigs = originalConfigs.current[messageId];
      const currentMessage = getThreadMessage({ threadId, messageId });
      const datasetId = currentMessage?.dataset_id!;

      if (!ogConfigs || ogConfigs.code !== sql) {
        try {
          await runSQL({
            messageId,
            threadId,
            sql: sql,
            datasetId
          });
          await timeout(700);
        } catch (error) {
          throw error;
        }
      }

      const payload: ThreadUpdateMessage['payload'] = {
        id: messageId,
        sql: sql
      };

      const res = await updateThreadMessageToServer(payload);
      const threadRes = await onSaveThreadChanges({
        threadId,
        save_draft: true,
        save_as_thread_state: messageId
      });

      setWarnBeforeNavigating(false);

      if (originalConfigs.current[messageId]) {
        onSetMessageData({
          messageId,
          data: originalConfigs.current[messageId]?.data!,
          data_metadata: originalConfigs.current[messageId]?.dataMetadata!,
          code: originalConfigs.current[messageId]?.code!,
          isDataFromRerun: false
        });
      }
      setResetTrigger((prev) => prev + 1);

      setTimeout(() => {
        openSuccessNotification({
          title: 'SQL Saved',
          message: 'Your changes have been saved.'
        });
      }, 120);

      delete originalConfigs.current[messageId];
    }
  );

  return {
    runSQL,
    resetRunSQLData,
    warnBeforeNavigating,
    setWarnBeforeNavigating,
    saveSQL,
    resetTrigger
  };
};

const BusterSQL = createContext<ReturnType<typeof useSQLProvider>>(
  {} as ReturnType<typeof useSQLProvider>
);

export const BusterSQLProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <BusterSQL.Provider value={useSQLProvider()}>{children}</BusterSQL.Provider>;
};

export const useSQLContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useSQLProvider>, T>
) => useContextSelector(BusterSQL, selector);

'use client';

import React, { useEffect, useMemo } from 'react';
import { useMemoizedFn, usePrevious, useUnmount, useWhyDidYouUpdate } from 'ahooks';
import { AppSplitter } from '@/components/layout';
import { ThreadControllerChartContent } from './ThreadControllerChartView';
import { ThreadControllerEditContent } from './ThreadControllerEditContent';
import { ChartType, ViewType } from '@/components/charts';
import {
  useBusterNewThreadsContextSelector,
  useBusterThreadIndividual,
  useBusterThreadMessage,
  useBusterThreadsContextSelector
} from '@/context/Threads';
import { canEditChart } from '@/context/Threads/helpers';
import { ShareRole } from '@/api/buster_socket/threads';
import { useBusterMessageDataContextSelector } from '@/context/MessageData';
import { useUserConfigContextSelector } from '@/context/Users';

export const ThreadContentController: React.FC<{
  threadLayout: [string, string];
  threadId: string;
  chartOnlyView?: boolean;
}> = React.memo(({ threadId, threadLayout, chartOnlyView = false }) => {
  const isAnonymousUser = useUserConfigContextSelector((state) => state.isAnonymousUser);
  const resetUndoRedoStack = useBusterThreadsContextSelector((x) => x.resetUndoRedoStack);
  const subscribeToThread = useBusterThreadsContextSelector((x) => x.subscribeToThread);
  const onUpdateMessageChartConfig = useBusterThreadsContextSelector(
    (x) => x.onUpdateMessageChartConfig
  );
  const onUpdateThreadMessage = useBusterThreadsContextSelector((x) => x.onUpdateThreadMessage);
  const setEditingThreadTitle = useBusterThreadsContextSelector((x) => x.setEditingThreadTitle);
  const editingThreadTitle = useBusterThreadsContextSelector((x) => x.editingThreadTitle);
  const onClearNewThreadModal = useBusterNewThreadsContextSelector((x) => x.onClearNewThreadModal);
  const unsubscribeFromAllThreadEvents = useBusterNewThreadsContextSelector(
    (x) => x.unsubscribeFromAllThreadEvents
  );
  const safeToUnsubscribe = useBusterNewThreadsContextSelector((x) => x.safeToUnsubscribe);
  const { thread } = useBusterThreadIndividual({ threadId });
  const { message: currentThreadMessage } = useBusterThreadMessage({ threadId });

  //We need to get the previous message to display the old message until the new one is ready
  const previousCurrentThreadMessageId =
    usePrevious(currentThreadMessage?.id) || currentThreadMessage?.id || '';

  const { message: previousThreadMessage } = useBusterThreadMessage({
    threadId,
    messageId: previousCurrentThreadMessageId
  });

  const currentMessageData = useBusterMessageDataContextSelector(({ getMessageData }) =>
    getMessageData(currentThreadMessage?.id!)
  );
  const previousMessageData = useBusterMessageDataContextSelector(({ getMessageData }) =>
    getMessageData(previousCurrentThreadMessageId!)
  );

  const isChartEditable = useMemo(
    () =>
      canEditChart(
        thread.id,
        currentMessageData,
        currentThreadMessage?.chart_config?.columnLabelFormats
      ),
    [thread.id, currentThreadMessage?.chart_config?.columnLabelFormats, currentMessageData]
  );

  const shouldUsePreviousMessage = useMemo(
    () =>
      thread.isFollowupMessage &&
      !currentMessageData?.retrievedData &&
      previousCurrentThreadMessageId,
    [thread.isFollowupMessage, currentMessageData?.retrievedData, previousCurrentThreadMessageId]
  );

  //WE need to display the old message until the new one is ready
  const chartViewThreadMessage = shouldUsePreviousMessage
    ? previousThreadMessage
    : currentThreadMessage;
  const chartViewThreadMessageData = shouldUsePreviousMessage
    ? previousMessageData
    : currentMessageData;

  const isReadOnly = thread.permission === ShareRole.VIEWER;

  const updateSelectedChart = useMemoizedFn((type: ChartType) => {
    onUpdateMessageChartConfig({
      threadId,
      chartConfig: { selectedChartType: type }
    });
  });

  const onSetViewType = useMemoizedFn((view: ViewType) => {
    onUpdateMessageChartConfig({
      threadId,
      chartConfig: { selectedView: view }
    });
  });

  const onChangeTitle = useMemoizedFn((title: string) => {
    onUpdateThreadMessage({
      threadId,
      messageId: currentThreadMessage?.id!,
      message: { title }
    });
  });

  useEffect(() => {
    safeToUnsubscribe.current = true;
    if (!thread || !thread?.isNewThread) {
      subscribeToThread({ threadId });
    }

    onClearNewThreadModal();
  }, [threadId]);

  useUnmount(() => {
    if (safeToUnsubscribe.current) {
      unsubscribeFromAllThreadEvents({ threadId });
      resetUndoRedoStack();
    }
  });

  return (
    <>
      <AppSplitter
        autoSaveId="thread"
        preserveSide="right"
        rightPanelMinSize={'275px'}
        rightPanelMaxSize={'450px'}
        rightHidden={isAnonymousUser || chartOnlyView}
        leftChildren={
          <ThreadControllerChartContent
            thread={thread}
            isReadOnly={isReadOnly}
            currentThreadMessage={chartViewThreadMessage}
            currentMessageData={chartViewThreadMessageData}
            onSetSelectedChart={updateSelectedChart}
            onSetViewType={onSetViewType}
            editingTitle={editingThreadTitle}
            setIsEditingTitle={setEditingThreadTitle}
            onChangeTitle={onChangeTitle}
            isChartEditable={isChartEditable}
            chartOnlyView={chartOnlyView}
          />
        }
        rightChildren={
          <ThreadControllerEditContent threadId={threadId} minSize={275} isReadOnly={isReadOnly} />
        }
        defaultLayout={threadLayout}
        leftHidden={false}
      />
    </>
  );
});
ThreadContentController.displayName = 'ThreadContentController';

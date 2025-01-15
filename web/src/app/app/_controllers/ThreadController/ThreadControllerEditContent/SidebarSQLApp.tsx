import React, { useEffect, useMemo } from 'react';
import { AppCodeEditor } from '@/components/inputs/AppCodeEditor';
import {
  IBusterThreadMessage,
  useBusterThreadMessage,
  useBusterThreadsContextSelector
} from '@/context/Threads';
import { Button } from 'antd';
import { useMemoizedFn, useUnmount } from 'ahooks';
import { useUserConfigContextSelector } from '@/context/Users';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useSQLContextSelector } from '@/context/SQL';
import { useBusterMessageDataContextSelector } from '@/context/MessageData';
import { AppMaterialIcons } from '@/components/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Text } from '@/components/text';
import { RustApiError } from '@/api/buster-rest/errors';
import { createStyles } from 'antd-style';
import { PreventNavigation } from '@/components';

export const SidebarSQLApp: React.FC<{}> = React.memo(({}) => {
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);
  const resetRunSQLData = useSQLContextSelector((x) => x.resetRunSQLData);
  const selectedThreadId = useBusterThreadsContextSelector((x) => x.selectedThreadId);
  const { message: currentThreadMessage } = useBusterThreadMessage({ threadId: selectedThreadId });
  const currentMessageData = useBusterMessageDataContextSelector(({ getMessageData }) =>
    getMessageData(currentThreadMessage?.id)
  );
  const runSQL = useSQLContextSelector((x) => x.runSQL);
  const onSetMessageDataCode = useBusterMessageDataContextSelector((x) => x.onSetMessageDataCode);
  const setWarnBeforeNavigating = useSQLContextSelector((x) => x.setWarnBeforeNavigating);
  const warnBeforeNavigating = useSQLContextSelector((x) => x.warnBeforeNavigating);

  const originalSQL = useMemo(
    () => currentThreadMessage?.code?.trim() || '',
    [currentThreadMessage?.code]
  );
  const editedSQL = currentMessageData?.code?.trim() || '';
  const [isRerunningSQL, setIsRerunningSQL] = React.useState(false);
  const [runSQLError, setRunSQLError] = React.useState<string | null>(null);
  const saveSQL = useSQLContextSelector((x) => x.saveSQL);
  const [isSavingSQL, setIsSavingSQL] = React.useState(false);

  const isChanged = editedSQL !== originalSQL;
  const datasetId = currentThreadMessage?.dataset_id;

  const canRunSQL: boolean = !!selectedThreadId && !!datasetId && !!currentThreadMessage?.id;

  const memoizedMonacoEditorOptions = useMemo(() => {
    return {
      readOnlyMessage: {
        value: 'Only owners can edit this SQL'
      }
    };
  }, []);

  const setEditedSQL = useMemoizedFn((value: string) => {
    onSetMessageDataCode({
      messageId: currentThreadMessage?.id!,
      code: value
    });
  });

  const onRerunQuery = useMemoizedFn(async () => {
    if (!datasetId || !editedSQL || !canRunSQL) return;
    setIsRerunningSQL(true);
    setRunSQLError(null);
    try {
      await runSQL({
        datasetId,
        sql: editedSQL,
        messageId: currentThreadMessage.id,
        threadId: selectedThreadId
      });
    } catch (error: any) {
      const message = (error as RustApiError)?.message;
      setRunSQLError(message || 'An error occurred');
    }
    setIsRerunningSQL(false);
  });

  const resetSQLPreflight = useMemoizedFn(async () => {
    await resetRunSQLData({
      threadId: selectedThreadId,
      messageId: currentThreadMessage?.id!
    });
  });

  const onSaveSQLPreflight = useMemoizedFn(async () => {
    setIsSavingSQL(true);
    try {
      await saveSQL({
        messageId: currentThreadMessage?.id!,
        threadId: selectedThreadId,
        sql: editedSQL
      });
    } catch (error) {
      const message = (error as RustApiError)?.message;
      setRunSQLError(message || 'An error occurred');
    } finally {
      setIsSavingSQL(false);
    }
  });

  useUnmount(() => {
    if (currentThreadMessage && isChanged) {
      resetRunSQLData({
        threadId: selectedThreadId,
        messageId: currentThreadMessage.id
      });
    }
  });

  useEffect(() => {
    setWarnBeforeNavigating(isChanged);
  }, [isChanged]);

  return (
    <>
      <div className="flex h-full w-full flex-col justify-between space-y-0">
        <div className="h-full">
          <AppCodeEditor
            readOnly={!isAdmin || isRerunningSQL}
            onChange={setEditedSQL}
            onMetaEnter={onRerunQuery}
            value={editedSQL}
            monacoEditorOptions={memoizedMonacoEditorOptions}
          />
        </div>
        <MessageContainer
          originalSQL={originalSQL}
          selectedThreadId={selectedThreadId}
          currentThreadMessage={currentThreadMessage}
          editedSQL={editedSQL}
          setEditedSQL={setEditedSQL}
          resetRunSQLData={resetRunSQLData}
          isAdmin={isAdmin}
          isRerunningSQL={isRerunningSQL}
          isChanged={isChanged}
          onRerunQuery={onRerunQuery}
          runSQLError={runSQLError}
          setRunSQLError={setRunSQLError}
          canRunSQL={canRunSQL}
          onSaveSQLPreflight={onSaveSQLPreflight}
          isSavingSQL={isSavingSQL}
        />
      </div>

      <PreventNavigation
        isDirty={warnBeforeNavigating}
        title="Navigate pages"
        description="You will lose your current changes."
        onOk={resetSQLPreflight}
        onCancel={onSaveSQLPreflight}
      />
    </>
  );
});
SidebarSQLApp.displayName = 'SidebarSQLApp';

const MessageContainer: React.FC<{
  originalSQL: string;
  selectedThreadId: string;
  currentThreadMessage: IBusterThreadMessage | null;
  editedSQL: string;
  setEditedSQL: (value: string) => void;
  resetRunSQLData: (value: { threadId: string; messageId: string }) => void;
  isAdmin: boolean;
  isRerunningSQL: boolean;
  isChanged: boolean;
  onRerunQuery: () => void;
  runSQLError: string | null;
  setRunSQLError: (value: string | null) => void;
  canRunSQL: boolean;
  onSaveSQLPreflight: () => void;
  isSavingSQL: boolean;
}> = React.memo(
  ({
    isChanged,
    editedSQL,
    setEditedSQL,
    originalSQL,
    selectedThreadId,
    currentThreadMessage,
    isRerunningSQL,
    resetRunSQLData,
    isAdmin,
    onRerunQuery,
    runSQLError,
    setRunSQLError,
    canRunSQL,
    onSaveSQLPreflight,
    isSavingSQL
  }) => {
    const { openInfoMessage } = useBusterNotifications();

    const disableReset = !isChanged;
    const disableSave = !isChanged;

    const onCopySQL = useMemoizedFn(() => {
      navigator.clipboard.writeText(editedSQL);
      openInfoMessage('SQL copied to clipboard');
    });

    const onReset = useMemoizedFn(() => {
      setEditedSQL(originalSQL);
      if (currentThreadMessage) {
        resetRunSQLData({
          threadId: selectedThreadId,
          messageId: currentThreadMessage.id
        });
      }
    });

    if (!isAdmin) return null;

    return (
      <TempContainer>
        <div className="flex flex-col space-y-0">
          <AnimatePresence>
            {runSQLError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="absolute left-0 top-0 w-full -translate-y-full overflow-hidden border-red-400 bg-red-100">
                <div className="flex items-start justify-between space-x-2 p-3">
                  <Text type="danger" className="flex-1">
                    {runSQLError}
                  </Text>

                  <button
                    onClick={() => setRunSQLError(null)}
                    className="mt-0.5 flex cursor-pointer items-center justify-center rounded p-1 text-red-600 transition-all duration-100 hover:bg-red-200">
                    <AppMaterialIcons icon="close" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between space-x-2">
            <Button block disabled={disableReset} onClick={onReset}>
              Reset
            </Button>
            <Button loading={isSavingSQL} block disabled={disableSave} onClick={onSaveSQLPreflight}>
              Save
            </Button>
            <Button block onClick={onCopySQL}>
              Copy SQL
            </Button>
            <Button
              loading={isRerunningSQL}
              block
              onClick={onRerunQuery}
              disabled={!canRunSQL}
              className="flex space-x-0">
              <span>Run</span>
              <AppMaterialIcons icon="keyboard_command_key" />
              <AppMaterialIcons icon="keyboard_return" />
            </Button>
          </div>
        </div>
      </TempContainer>
    );
  }
);
MessageContainer.displayName = 'MessageContainer';

const TempContainer: React.FC<{
  children: React.ReactNode;
}> = React.memo(({ children }) => {
  const { styles, cx } = useStyles();
  return <div className={cx(styles.container, 'relative p-4')}>{children}</div>;
});
TempContainer.displayName = 'TempContainer';

const useStyles = createStyles(({ token, css }) => ({
  container: css`
    border-top: 0.5px solid ${token.colorBorder};
  `
}));

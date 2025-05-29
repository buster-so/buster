'use client';

import { Button } from '@/components/ui/buttons/Button';
import { FileCard } from '@/components/ui/card/FileCard';
import { ErrorClosableContainer } from '@/components/ui/error/ErrorClosableContainer';
import { Command, ReturnKey } from '@/components/ui/icons';
import { AppCodeEditor } from '@/components/ui/inputs/AppCodeEditor';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import React, { useMemo, useState } from 'react';
import type { AppVerticalCodeSplitterProps } from './AppVerticalCodeSplitter';

export const SQLContainer: React.FC<{
  className?: string;
  sql: string | undefined;
  setDatasetSQL: (sql: string) => void;
  onRunQuery: () => Promise<void>;
  onSaveSQL: AppVerticalCodeSplitterProps['onSaveSQL'];
  disabledSave?: AppVerticalCodeSplitterProps['disabledSave'];
  error?: string | null;
  readOnly?: boolean;
}> = React.memo(
  ({
    disabledSave,
    className = '',
    readOnly = false,
    sql,
    setDatasetSQL,
    onRunQuery,
    onSaveSQL,
    error
  }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { openInfoMessage } = useBusterNotifications();

    const onCopySQL = useMemoizedFn(() => {
      navigator.clipboard.writeText(sql || '');
      openInfoMessage('SQL copied to clipboard');
    });

    const onRunQueryPreflight = useMemoizedFn(async () => {
      setIsRunning(true);
      await onRunQuery();
      setIsRunning(false);
    });

    const onSaveSQLPreflight = useMemoizedFn(async () => {
      setIsSaving(true);
      await onSaveSQL?.();
      setIsSaving(false);
    });

    const memoizedFooter = useMemo(() => {
      return (
        <>
          <Button onClick={onCopySQL}>Copy SQL</Button>

          <div className="flex items-center gap-2">
            {onSaveSQL && (
              <Button
                disabled={disabledSave || !sql || isRunning}
                variant="black"
                loading={isSaving}
                onClick={onSaveSQLPreflight}>
                Save
              </Button>
            )}

            {!readOnly && (
              <Button
                variant="default"
                loading={isRunning}
                disabled={!sql}
                className="flex items-center space-x-0"
                onClick={onRunQueryPreflight}
                suffix={
                  <div className="flex items-center gap-x-1 text-sm">
                    <Command />
                    <ReturnKey />
                  </div>
                }>
                Run
              </Button>
            )}
          </div>
        </>
      );
    }, [
      disabledSave,
      isRunning,
      onCopySQL,
      onRunQueryPreflight,
      onSaveSQL,
      sql,
      isSaving,
      onSaveSQLPreflight
    ]);

    return (
      <FileCard
        className={className}
        footerClassName="flex justify-between file-card space-x-4"
        footer={memoizedFooter}>
        <AppCodeEditor
          className="overflow-hidden border-x-0 border-t-0"
          value={sql}
          onChange={setDatasetSQL}
          onMetaEnter={onRunQueryPreflight}
          variant={null}
          readOnly={readOnly}
        />

        {error && <ErrorClosableContainer error={error} />}
      </FileCard>
    );
  }
);

SQLContainer.displayName = 'SQLContainer';

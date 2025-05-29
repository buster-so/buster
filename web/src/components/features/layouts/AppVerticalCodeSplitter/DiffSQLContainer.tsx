'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { FileCard } from '@/components/ui/card/FileCard';
import { Copy2 } from '@/components/ui/icons';
import { AppDiffCodeEditor } from '@/components/ui/inputs/AppDiffCodeEditor';
import { TextAndVersionPill } from '@/components/ui/typography/TextAndVersionPill';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import type { AppVerticalCodeSplitterProps } from './AppVerticalCodeSplitter';

export const DiffSQLContainer: React.FC<{
  className?: string;
  originalValue: string | undefined;
  value: string | undefined;
  setValue: (value: string) => void;
  onRunQuery: () => Promise<void>;
  onSaveSQL?: AppVerticalCodeSplitterProps['onSaveSQL'];
  disabledSave?: AppVerticalCodeSplitterProps['disabledSave'];
  error?: string | null;
  language: 'sql' | 'yaml';
  fileName?: string;
  versionNumber?: number;
}> = React.memo(
  ({
    language,
    disabledSave,
    className = '',
    originalValue,
    value,
    setValue,
    onRunQuery,
    onSaveSQL,
    error,
    fileName,
    versionNumber
  }) => {
    const [isRunning, setIsRunning] = useState(false);
    const { openInfoMessage } = useBusterNotifications();

    const onCopySQL = useMemoizedFn(() => {
      navigator.clipboard.writeText(value || '');
      openInfoMessage('Copied to clipboard');
    });

    const onRunQueryPreflight = useMemoizedFn(async () => {
      setIsRunning(true);
      await onRunQuery();
      setIsRunning(false);
    });

    return (
      <FileCard
        headerButtons={useMemo(
          () => <Button prefix={<Copy2 />} variant="ghost" onClick={onCopySQL} />,
          [onCopySQL]
        )}
        fileName={useMemo(
          () => <TextAndVersionPill fileName={fileName || ''} versionNumber={versionNumber || 0} />,
          [fileName, versionNumber]
        )}>
        <AppDiffCodeEditor
          className="overflow-hidden"
          modified={value || ''}
          original={originalValue || ''}
          language={language}
          onChange={setValue}
          readOnly={true}
        />
      </FileCard>
    );
  }
);

DiffSQLContainer.displayName = 'DiffSQLContainer';

import React, { useEffect, useState } from 'react';
import { CodeCard } from '@/components/ui/card/CodeCard';
import { useMemoizedFn } from '@/hooks';
import { SaveResetFilePopup } from '../popups/SaveResetFilePopup';

export const EditFileContainer: React.FC<{
  fileName: string | undefined;
  file: string | undefined;
  onSaveFile: (file: string) => void;
  error: string | undefined;
  isSaving: boolean | undefined;
  language?: string;
  readOnly: boolean | undefined;
}> = React.memo(
  ({ fileName, readOnly, error, isSaving, file: fileProp = '', onSaveFile, language = 'yaml' }) => {
    const [file, setFile] = useState<string>(fileProp || '');

    const showPopup = file !== fileProp && !!file;

    const onResetFile = useMemoizedFn(() => {
      setFile(fileProp || '');
    });

    const onSaveFilePreflight = useMemoizedFn(() => {
      onSaveFile(file);
    });

    useEffect(() => {
      setFile(fileProp || '');
    }, [fileProp]);

    return (
      <div className="relative h-full overflow-hidden p-5">
        <CodeCard
          code={file || ''}
          language={language}
          fileName={fileName || ''}
          onChange={setFile}
          onMetaEnter={onSaveFilePreflight}
          error={error}
          readOnly={readOnly}
        />

        <SaveResetFilePopup
          open={showPopup}
          onReset={onResetFile}
          onSave={onSaveFilePreflight}
          isSaving={isSaving}
          showHotsKeys
        />
      </div>
    );
  }
);

EditFileContainer.displayName = 'EditFileContainer';

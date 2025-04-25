import type { FileContainerSecondaryProps } from './interfaces';
import { SelectedFileSecondaryRecord } from './secondaryPanelsConfig';
import { useMemo } from 'react';
import React from 'react';
export const FileContainerSecondary: React.FC<FileContainerSecondaryProps> = ({
  selectedFile,
  selectedFileViewSecondary
}) => {
  const Component = useMemo(() => {
    if (!selectedFile || !selectedFileViewSecondary) return null;

    const assosciatedType = SelectedFileSecondaryRecord[selectedFile?.type];

    if (!assosciatedType) return null;

    return assosciatedType[selectedFileViewSecondary];
  }, [selectedFileViewSecondary, selectedFile?.id, selectedFile?.type]);

  return (
    <>
      {Component && (
        <Component
          selectedFile={selectedFile}
          selectedFileViewSecondary={selectedFileViewSecondary}
        />
      )}
    </>
  );
};

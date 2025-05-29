import React from 'react';
import { VersionPill } from '../tags/VersionPill';
import { Text } from './Text';

export const TextAndVersionPill = React.memo(
  ({ fileName, versionNumber }: { fileName: string; versionNumber: number }) => {
    return (
      <div className="flex w-full items-center gap-1.5">
        <Text truncate>{fileName}</Text>
        {versionNumber !== undefined && <VersionPill version_number={versionNumber} />}
      </div>
    );
  }
);

TextAndVersionPill.displayName = 'TextAndVersionPill';

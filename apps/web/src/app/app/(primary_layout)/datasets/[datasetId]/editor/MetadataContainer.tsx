import React from 'react';
import { DynamicAppCodeEditor as AppCodeEditor } from '@/components/ui/inputs/AppCodeEditor/DynamicAppCodeEditor';
import { cn } from '@/lib/classMerge';

export const MetadataContainer: React.FC<{
  ymlFile: string;
  readOnly?: boolean;
  setYmlFile: (ymlFile: string) => void;
}> = React.memo(({ ymlFile, setYmlFile, readOnly = false }) => {
  return (
    <div className={cn('bg-background flex h-full w-full flex-col overflow-hidden rounded border')}>
      <AppCodeEditor
        language="yaml"
        className="border-none"
        value={ymlFile}
        onChange={setYmlFile}
        readOnly={readOnly}
      />
    </div>
  );
});

MetadataContainer.displayName = 'MetadataContainer';

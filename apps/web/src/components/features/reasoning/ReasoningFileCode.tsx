'use client';

import React, { useMemo } from 'react';
import type { BusterChatMessageReasoning_file } from '@/api/asset_interfaces';
import { Text } from '@/components/ui/typography';
import { TextAndVersionPill } from '@/components/ui/typography/TextAndVersionPill';
import { StreamingMessageCode } from '@/components/ui/streaming/StreamingMessageCode';

export const ReasoningFileCode: React.FC<
  BusterChatMessageReasoning_file & {
    isCompletedStream: boolean;
    collapsible?: 'chevron' | 'overlay-peek' | false;
    buttons?: React.ReactNode;
  }
> = ({
  isCompletedStream,
  file,
  file_type,
  file_name,
  version_number,
  buttons,
  collapsible = false
}) => {
  const { text = '', modified } = file;

  const fileInfo: React.ReactNode = useMemo(() => {
    if (file_type === 'dashboard' || file_type === 'metric') {
      return <TextAndVersionPill fileName={file_name} versionNumber={version_number} />;
    }

    return <Text>{file_name}</Text>;
  }, [file_name, version_number]);

  return (
    <StreamingMessageCode
      fileName={fileInfo}
      text={text}
      modified={modified}
      collapsible={collapsible}
      buttons={buttons}
      isStreamFinished={isCompletedStream}
    />
  );
};

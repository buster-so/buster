import { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat/chatMessageInterfaces';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { CollapisbleFileCard } from '@/components/ui/card/CollapisbleFileCard';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { Text } from '@/components/ui/typography';
import { TextAndVersionText } from '@/components/ui/typography/TextAndVersionText';

export const ChatResponseMessage_StandardFile: React.FC<{
  responseMessage: BusterChatResponseMessage_file;
  isSelectedFile: boolean;
  href: string;
}> = React.memo(({ responseMessage, isSelectedFile, href }) => {
  const { file_type, file_name, version_number } = responseMessage;

  const selectedIcon = useMemo(() => {
    if (file_type === 'metric') return <ASSET_ICONS.metrics />;
    if (file_type === 'dashboard') return <ASSET_ICONS.dashboards />;
    return null;
  }, [file_type]);

  const icon = useMemo(() => {
    if (!selectedIcon) return null;
    return (
      <Text size={'lg'} variant={'secondary'}>
        {selectedIcon}
      </Text>
    );
  }, [selectedIcon]);

  return (
    <Link href={href} prefetch data-testid="chat-response-message-file">
      <CollapisbleFileCard
        fileName={<TextAndVersionText text={file_name} version={version_number} />}
        icon={icon}
        collapsible={false}
        selected={isSelectedFile}
      />
    </Link>
  );
});

ChatResponseMessage_StandardFile.displayName = 'ChatResponseMessage_StandardFile';

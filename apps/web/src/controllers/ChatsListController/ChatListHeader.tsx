import type React from 'react';
import { Text } from '@/components/ui/typography';

export const ChatListHeader: React.FC<{
  type: 'logs' | 'chats';
}> = ({ type }) => {
  const title = type === 'logs' ? 'Logs' : 'Chats';
  return <Text>{title}</Text>;
};

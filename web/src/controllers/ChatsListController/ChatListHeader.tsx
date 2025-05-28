import { Text } from '@/components/ui/typography';
import type React from 'react';

export const ChatListHeader: React.FC<{
  type: 'logs' | 'chats';
}> = ({ type }) => {
  const title = type === 'logs' ? 'Logs' : 'Chats';
  return <Text>{title}</Text>;
};

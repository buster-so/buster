import { AppPageLayout } from '@/components/ui/layouts';
import React from 'react';
import { ChatListHeader } from '../../../../controllers/ChatsListController/ChatListHeader';
import { ChatListContainer } from '../../../../controllers/ChatsListController';

export const dynamic = 'force-static';

const type = 'logs';

export default function LogsPage() {
  return (
    <AppPageLayout headerSizeVariant="list" header={<ChatListHeader type={type} />}>
      <ChatListContainer type={type} />
    </AppPageLayout>
  );
}

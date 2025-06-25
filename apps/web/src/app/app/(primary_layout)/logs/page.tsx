import { AppPageLayout } from '@/components/ui/layouts';
import { ChatListContainer } from '../../../../controllers/ChatsListController';
import { ChatListHeader } from '../../../../controllers/ChatsListController/ChatListHeader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logs'
};

const type = 'logs';

export default function LogsPage() {
  return (
    <AppPageLayout headerSizeVariant="list" header={<ChatListHeader type={type} />}>
      <ChatListContainer type={type} />
    </AppPageLayout>
  );
}

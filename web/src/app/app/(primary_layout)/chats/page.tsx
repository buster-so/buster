import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { ChatListContainer } from '../../../../controllers/ChatsListController';
import { ChatListHeader } from '../../../../controllers/ChatsListController/ChatListHeader';

export const dynamic = 'force-static';

const type = 'chats';

export default function ChatsPage() {
  return (
    <AppPageLayout headerSizeVariant="list" header={<ChatListHeader type={type} />}>
      <ChatListContainer type={type} />
    </AppPageLayout>
  );
}

import { ClosePageButton } from '@/components/features/chat/ClosePageButton';
import { AppSegmented } from '@/components/ui/segmented';
import { useGetChatId } from '@/context/Chats/useGetChatId';
import { ReasoningController } from '@/controllers/ReasoningController';
import { AssetContainer } from '@/layouts/AssetContainer/AssetContainer';
import { useGetReasoningMessageId } from '../useGetReasoningMessageId';
import { useIsEmbed } from '../useIsEmbed';

export const component = () => {
  const chatId = useGetChatId() || '';
  const messageId = useGetReasoningMessageId() || '';
  return (
    <AssetContainer header={<ReasoningControllerHeader />} headerBorderVariant="ghost" scrollable>
      <ReasoningController chatId={chatId} messageId={messageId} />
    </AssetContainer>
  );
};

const ReasoningControllerHeader: React.FC = () => {
  const isEmbed = useIsEmbed();
  return (
    <div className="w-full flex items-center justify-between">
      <AppSegmented
        type="button"
        options={[
          {
            value: 'reasoning',
            label: 'Reasoning',
          },
        ]}
      />
      <ClosePageButton isEmbed={isEmbed} />
    </div>
  );
};

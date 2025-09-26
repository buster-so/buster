import { createFileRoute } from '@tanstack/react-router';
import { ClosePageButton } from '@/components/features/chat/ClosePageButton';
import { AppSegmented } from '@/components/ui/segmented';
import { ReasoningController } from '@/controllers/ReasoningController/ReasoningController';
import { AssetContainer } from '@/layouts/AssetContainer/AssetContainer';

export const Route = createFileRoute('/embed/chats/$chatId/reasoning/$messageId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { chatId, messageId } = Route.useParams();
  return (
    <AssetContainer header={<ReasoningControllerHeader />} headerBorderVariant="ghost" scrollable>
      <ReasoningController chatId={chatId} messageId={messageId} />
    </AssetContainer>
  );
}

const ReasoningControllerHeader: React.FC = () => {
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
      <ClosePageButton />
    </div>
  );
};

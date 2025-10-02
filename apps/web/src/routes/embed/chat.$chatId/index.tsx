import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/embed/chat/$chatId/')({
  component: RouteComponent,
  staticData: {
    assetType: 'chat',
  },
});

function RouteComponent() {
  return null;
}

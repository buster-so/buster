import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/embed/chats/$chatId/')({
  component: RouteComponent,
});

function RouteComponent() {
  return null;
}

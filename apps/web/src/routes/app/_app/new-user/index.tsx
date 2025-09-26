import { createFileRoute } from '@tanstack/react-router';
import { NewUserController } from '@/controllers/NewUserController';

export const Route = createFileRoute('/app/_app/new-user/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <NewUserController />;
}

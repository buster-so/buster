import { createFileRoute, redirect } from '@tanstack/react-router';
import { BUSTER_GETTING_STARTED_URL } from '@/config/externalRoutes';

export const Route = createFileRoute('/info/getting-started')({
  component: () => null,
  beforeLoad: () => {
    throw redirect({ href: BUSTER_GETTING_STARTED_URL, replace: true, statusCode: 307 });
  },
});

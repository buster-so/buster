import { createFileRoute, redirect } from '@tanstack/react-router';
import { BUSTER_SIGN_UP_URL } from '../../config/externalRoutes';

export const Route = createFileRoute('/info/getting-started')({
  component: () => null,
  beforeLoad: () => {
    throw redirect({ href: BUSTER_SIGN_UP_URL, replace: true, statusCode: 307 });
  },
});

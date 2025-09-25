import { createFileRoute, redirect } from '@tanstack/react-router';
import { signOutServerFn } from '@/integrations/supabase/signOut';

export const Route = createFileRoute('/auth/logout')({
  ssr: true,
  head: () => ({
    meta: [
      { title: 'Logout' },
      { name: 'description', content: 'Logout from your Buster account' },
      { name: 'og:title', content: 'Logout' },
      { name: 'og:description', content: 'Logout from your Buster account' },
    ],
  }),
  preload: false,
  loader: async () => {
    await signOutServerFn();
    throw redirect({ to: '/auth/login', statusCode: 307, reloadDocument: true, replace: true });
  },
});

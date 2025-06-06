import { permanentRedirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';

export default function AppHomePage() {
  permanentRedirect(
    createBusterRoute({
      route: BusterRoutes.APP_HOME
    })
  );

  return null;
}

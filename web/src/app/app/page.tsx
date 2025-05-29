import { BusterRoutes, createBusterRoute } from '@/routes';
import { permanentRedirect } from 'next/navigation';

export default function AppHomePage() {
  permanentRedirect(
    createBusterRoute({
      route: BusterRoutes.APP_HOME
    })
  );

  return null;
}

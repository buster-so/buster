import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';

export default async function Index() {
  return redirect(
    createBusterRoute({
      route: BusterRoutes.APP_HOME
    })
  );
}

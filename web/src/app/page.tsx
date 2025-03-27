import { BusterRoutes, createBusterRoute } from '@/routes';
import { redirect } from 'next/navigation';

export default async function Index() {
  return redirect(
    createBusterRoute({
      route: BusterRoutes.APP_HOME
    })
  );
}

import { BusterRoutes, createBusterRoute } from '@/routes';
import { permanentRedirect } from 'next/navigation';

export default async function Page(props: { params: Promise<{ datasetId: string }> }) {
  const params = await props.params;

  const { datasetId } = params;

  return permanentRedirect(
    createBusterRoute({
      route: BusterRoutes.APP_DATASETS_ID_PERMISSIONS_OVERVIEW,
      datasetId
    })
  );
}

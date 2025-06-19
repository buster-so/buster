import { permanentRedirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';

export default async function DatasetPage(props: { params: Promise<{ datasetId: string }> }) {
  const params = await props.params;

  const { datasetId } = params;

  permanentRedirect(
    createBusterRoute({
      route: BusterRoutes.APP_DATASETS_ID_OVERVIEW,
      datasetId
    })
  );

  return null;
}

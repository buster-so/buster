import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import last from 'lodash/last';
import { prefetchGetDatasetMetadata } from '@/api/buster_rest/datasets/queryRequests';
import { DatasetsIndividualLayout } from '@/controllers/DatasetsControllers/DatasetsIndividualLayout/DatasetsLayout';

export const Route = createFileRoute('/app/_app/datasets/$datasetId')({
  beforeLoad: async ({ params, matches }) => {
    const isDatasetRoot = last(matches).path === '/app/datasets/$datasetId';
    if (isDatasetRoot) {
      throw redirect({
        to: '/app/datasets/$datasetId/overview',
        params,
        replace: true,
        statusCode: 307,
      });
    }
  },
  loader: async ({ params, context }) => {
    const queryClient = context.queryClient;
    const { dataset } = await prefetchGetDatasetMetadata(params.datasetId, queryClient);
    const title = dataset?.name;
    return {
      title,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title || 'Dataset' },
      { name: 'description', content: 'Explore and analyze your dataset' },
      { name: 'og:title', content: 'Dataset' },
      { name: 'og:description', content: 'Explore and analyze your dataset' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { datasetId } = Route.useParams();
  return (
    <DatasetsIndividualLayout datasetId={datasetId}>
      <Outlet />
    </DatasetsIndividualLayout>
  );
}

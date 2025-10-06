import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetCollection } from '@/api/buster_rest/collections';
import { CollectionIndividualController } from '@/controllers/CollectionIndividualController';

export const Route = createFileRoute('/app/_app/_asset/collections/$collectionId/')({
  staticData: {
    assetType: 'collection',
  },
  loader: async ({ params, context }) => {
    const collection = await prefetchGetCollection(context.queryClient, {
      id: params.collectionId,
    });
    return {
      title: collection?.name,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title || 'Collection' },
      { name: 'description', content: 'View and manage your collection items' },
      { name: 'og:title', content: 'Collection' },
      { name: 'og:description', content: 'View and manage your collection items' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { collectionId } = Route.useParams();
  return <CollectionIndividualController collectionId={collectionId} />;
}

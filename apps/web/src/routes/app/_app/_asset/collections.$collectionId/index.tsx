import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { prefetchGetCollection } from '@/api/buster_rest/collections';
import { getCookie } from '@/api/server-functions/getCookie';
import { COLLECTION_LAYOUT_COOKIE_NAME } from '@/context/Collections/collection-cookies';
import { CollectionIndividualController } from '@/controllers/CollectionIndividualController';

export const Route = createFileRoute('/app/_app/_asset/collections/$collectionId/')({
  staticData: {
    assetType: 'collection',
  },
  validateSearch: z.object({
    layout: z.enum(['grid', 'list']).catch('grid').optional(),
  }),
  loader: async ({ params, context }) => {
    const cookieName = COLLECTION_LAYOUT_COOKIE_NAME(params.collectionId);
    const collectionLayout: 'grid' | 'list' = await getCookie({ data: cookieName }).then((v) => {
      if (v === 'list') return 'list';
      return 'grid';
    });
    const collection = await prefetchGetCollection(context.queryClient, {
      id: params.collectionId,
    });
    return {
      title: collection?.name,
      collectionLayout,
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
  const { collectionLayout } = Route.useLoaderData();
  const { layout } = Route.useSearch();

  return (
    <CollectionIndividualController
      collectionId={collectionId}
      layout={layout || collectionLayout}
    />
  );
}

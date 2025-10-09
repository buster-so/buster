import type { AssetType } from '@buster/server-shared/assets';
import { createFileRoute, Outlet, type RouteContext } from '@tanstack/react-router';
import { getTitle as getAssetTitle } from '@/api/buster_rest/title';
import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';

export const Route = createFileRoute('/app/_app/_asset')({
  ssr: false,
  component: RouteComponent,
  context: () => ({ getAssetTitle }),
  beforeLoad: async ({ matches }) => {
    const assetType = [...matches].reverse().find(({ staticData }) => staticData?.assetType)
      ?.staticData?.assetType as AssetType;
    return { assetType };
  },
  loader: async ({ context }) => {
    const { assetType } = context;
    return { assetType };
  },
});

const stableCtxSelector = (ctx: RouteContext) => ctx.assetType;
function RouteComponent() {
  const assetType = Route.useLoaderData({ select: stableCtxSelector }) || 'metric_file';

  return (
    <AppAssetCheckLayout assetType={assetType}>
      <Outlet />
    </AppAssetCheckLayout>
  );
}

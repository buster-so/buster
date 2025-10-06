import type { AssetType } from '@buster/server-shared/assets';
import { createFileRoute, Outlet, type RouteContext } from '@tanstack/react-router';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users';
import { NotFoundCard } from '@/components/features/global/NotFoundCard';
import { useGetChatId } from '@/context/Chats/useGetChatId';
import { getSupabaseSession } from '@/integrations/supabase/getSupabaseUserClient';
import { signInWithAnonymousUser } from '@/integrations/supabase/signIn';
import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';
import { cn } from '@/lib/classMerge';

export const Route = createFileRoute('/embed')({
  beforeLoad: async ({ context, matches }) => {
    const token = await getSupabaseSession();
    if (token.accessToken) await prefetchGetMyUserInfo(context.queryClient);
    else await signInWithAnonymousUser(); //we fallback to an anonymous user

    const assetType = [...matches].reverse().find(({ staticData }) => staticData?.assetType)
      ?.staticData?.assetType as AssetType;

    return {
      assetType,
    };
  },
  loader: async ({ context }) => {
    const { assetType } = context;
    return { assetType };
  },
  component: RouteComponent,
  ssr: false,
});

const stableCtxSelector = (ctx: RouteContext) => ctx.assetType;
function RouteComponent() {
  const assetType = Route.useLoaderData({ select: stableCtxSelector });
  const chatId = useGetChatId();

  if (!assetType) {
    return (
      <div className="flex flex-col gap-3 h-full w-full items-center justify-center">
        <NotFoundCard />
      </div>
    );
  }

  const isChat = assetType === 'chat' || !!chatId;

  return (
    <main
      data-testid={`embed-main-${assetType}`}
      className={cn(
        'h-full w-full bg-page-background overflow-y-auto',
        isChat && 'overflow-y-hidden bg-background-secondary'
      )}
    >
      <AppAssetCheckLayout assetType={assetType}>
        <Outlet />
      </AppAssetCheckLayout>
    </main>
  );
}

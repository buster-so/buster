import type { AssetType } from '@buster/server-shared/assets';
import type { QueryClient } from '@tanstack/react-query';
import { Outlet, useRouteContext } from '@tanstack/react-router';
import omit from 'lodash/omit';
import { lazy, Suspense } from 'react';
import { prefetchGetChat } from '@/api/buster_rest/chats';
import { getAppLayout } from '@/api/server-functions/getAppLayout';
import {
  chooseInitialLayout,
  getDefaultLayout,
  getDefaultLayoutMode,
} from '@/context/Chats/selected-mode-helpers';
import { ChatLayout } from '@/layouts/ChatLayout/ChatLayout';

const ErrorCard = lazy(() =>
  import('@/components/features/global/GlobalErrorCard').then((module) => ({
    default: module.ErrorCard,
  }))
);

export const beforeLoad = async ({
  params,
  context,
}: {
  params: { chatId: string };
  context: { assetType: AssetType };
}) => {
  const chatId = params.chatId;
  const assetParams = omit(params, 'chatId');
  const assetType = context.assetType;
  const autoSaveId = `chat-${chatId ? 'C' : 'NXC'}-${assetType ? 'Y' : 'NXA'}`;
  const selectedLayout = getDefaultLayoutMode({
    chatId,
    assetParams,
  });
  const defaultLayout = getDefaultLayout({
    layout: selectedLayout,
  });
  const chatLayout = await getAppLayout({ id: autoSaveId });

  const initialLayout = chooseInitialLayout({
    layout: selectedLayout,
    initialLayout: chatLayout,
    defaultLayout,
  });

  return {
    autoSaveId,
    initialLayout,
    defaultLayout,
    selectedLayout,
  };
};

export const loader = async ({
  params,
  context,
}: {
  params: { chatId: string };
  context: { queryClient: QueryClient };
}) => {
  const chatId = params.chatId;
  const [chat] = await Promise.all([prefetchGetChat({ id: chatId }, context.queryClient)]);
  const title = chat?.title;
  return {
    title,
  };
};

export const head = ({ loaderData }: { loaderData?: { title: string | undefined } } = {}) => ({
  meta: [
    { title: loaderData?.title || 'Chat' },
    { name: 'description', content: 'View and interact with your chat conversation' },
    { name: 'og:title', content: 'Chat' },
    { name: 'og:description', content: 'View and interact with your chat conversation' },
  ],
});

export const staticData = {
  assetType: 'chat' as Extract<AssetType, 'chat'>,
};

export const component = () => {
  const { initialLayout, selectedLayout, autoSaveId, defaultLayout } = useRouteContext({
    strict: false,
  });

  if (!initialLayout || !selectedLayout || !autoSaveId || !defaultLayout) {
    return (
      <Suspense fallback={<div />}>
        <ErrorCard
          header="Hmmm... Something went wrong."
          message="An error occurred while loading the chat."
        />
      </Suspense>
    );
  }

  return (
    <ChatLayout
      initialLayout={initialLayout}
      autoSaveId={autoSaveId}
      defaultLayout={defaultLayout}
      selectedLayout={selectedLayout}
    >
      <Outlet />
    </ChatLayout>
  );
};

import { useMemo } from 'react';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { useGetInitialChatFile } from '@/layouts/ChatLayout/ChatContext/useGetInitialChatFile';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

export const useCloseVersionHistory = () => {
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const chatId = useChatLayoutContextSelector((x) => x.chatId);
  const metricId = useChatLayoutContextSelector((x) => x.metricId);
  const dashboardId = useChatLayoutContextSelector((x) => x.dashboardId);
  const messageId = useChatLayoutContextSelector((x) => x.messageId);
  const currentRoute = useChatLayoutContextSelector((x) => x.currentRoute);
  const getInitialChatFileHref = useGetInitialChatFile();

  const href = useMemo(() => {
    if (!chatId) {
      if (metricId) {
        return createBusterRoute({
          route: BusterRoutes.APP_METRIC_ID_CHART,
          metricId
        });
      }

      if (dashboardId) {
        return createBusterRoute({
          route: BusterRoutes.APP_DASHBOARD_ID,
          dashboardId
        });
      }

      return '';
    }

    return (
      getInitialChatFileHref({
        metricId,
        dashboardId,
        chatId,
        currentRoute,
        dashboardVersionNumber: undefined,
        metricVersionNumber: undefined,
        messageId
      }) || 'error'
    );
  }, [chatId, messageId, metricId, dashboardId, getInitialChatFileHref, currentRoute]);

  const onCloseVersionHistory = useMemoizedFn(() => {
    onChangePage(href);
  });

  return { href, onCloseVersionHistory };
};

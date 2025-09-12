import type { AssetType } from '@buster/server-shared/assets';
import type { RegisteredRouter } from '@tanstack/react-router';
import { defineLink } from '@/lib/routes';

export const createSimpleAssetRoute = <
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>(asset: {
  asset_type: AssetType;
  id: string;
}) => {
  if (asset.asset_type === 'chat') {
    return defineLink({
      to: '/app/chats/$chatId',
      params: { chatId: asset.id },
    });
  }

  if (asset.asset_type === 'metric') {
    return defineLink({
      to: '/app/metrics/$metricId',
      params: { metricId: asset.id },
    });
  }

  if (asset.asset_type === 'dashboard') {
    return defineLink({
      to: '/app/dashboards/$dashboardId',
      params: { dashboardId: asset.id },
    });
  }

  if (asset.asset_type === 'collection') {
    return defineLink({
      to: '/app/collections/$collectionId',
      params: { collectionId: asset.id },
    });
  }

  if (asset.asset_type === 'report') {
    return defineLink({
      to: '/app/reports/$reportId',
      params: { reportId: asset.id },
    });
  }

  const _exhaustiveCheck: never = asset.asset_type;

  return defineLink({
    to: '/app/chats/$chatId',
    params: { chatId: asset.id },
  });
};

'use client';

import { useQueryClient } from '@tanstack/react-query';
import type React from 'react';
import { useCallback, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import type { ShareAssetType } from '@buster/server-shared/share';
import { queryKeys } from '@/api/query_keys';
import { useMemoizedFn } from '@/hooks';
import { timeout } from '@/lib';

const useBusterAssets = () => {
  const queryClient = useQueryClient();
  const [assetsToPasswords, setAssetsToPasswords] = useState<
    Record<
      string,
      {
        password: string;
        type: ShareAssetType;
      }
    >
  >({});
  const [assetsPasswordErrors, setAssetsPasswordErrors] = useState<Record<string, string | null>>(
    {}
  );

  const invalidateAssetData = useMemoizedFn(async (assetId: string, type: ShareAssetType) => {
    if (type === 'metric') {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.metricsGetMetric(assetId, null).queryKey,
        refetchType: 'all'
      });
    } else if (type === 'dashboard') {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboardGetDashboard(assetId, null).queryKey,
        refetchType: 'all'
      });
    } else if (type === 'collection') {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.collectionsGetCollection(assetId).queryKey,
        refetchType: 'all'
      });
    } else if (type === 'chat') {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.chatsGetChat(assetId).queryKey,
        refetchType: 'all'
      });
    } else if (type === 'report') {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.reportsGetReport(assetId).queryKey,
        refetchType: 'all'
      });
    } else {
      const exhaustiveCheck: never = type;
    }
  });

  const onSetAssetPassword = useMemoizedFn(
    async (assetId: string, password: string, type: ShareAssetType) => {
      setAssetsToPasswords((prev) => ({ ...prev, [assetId]: { password, type } }));
      removeAssetPasswordError(assetId);
      await timeout(150);
      await invalidateAssetData(assetId, type);
    }
  );

  const getAssetPassword = useCallback(
    (
      assetId: string | undefined
    ): {
      password: undefined | string;
      error: string | null;
      type: ShareAssetType | undefined;
    } => {
      if (!assetId) {
        return {
          password: undefined,
          type: undefined,
          error: null
        };
      }
      return {
        password: assetsToPasswords[assetId]?.password || undefined,
        type: assetsToPasswords[assetId]?.type || undefined,
        error: assetsPasswordErrors[assetId] || null
      };
    },
    [assetsToPasswords, assetsPasswordErrors]
  );

  const setAssetPasswordError = useMemoizedFn((assetId: string, error: string | null) => {
    setAssetsPasswordErrors((prev) => ({ ...prev, [assetId]: error }));
  });

  const removeAssetPasswordError = useMemoizedFn((assetId: string) => {
    setAssetsPasswordErrors((prev) => {
      return { ...prev, [assetId]: null };
    });
  });

  return {
    setAssetPasswordError,
    removeAssetPasswordError,
    onSetAssetPassword,
    getAssetPassword
  };
};

const BusterAssetsContext = createContext<ReturnType<typeof useBusterAssets>>(
  {} as ReturnType<typeof useBusterAssets>
);

export const BusterAssetsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const value = useBusterAssets();
  return <BusterAssetsContext.Provider value={value}>{children}</BusterAssetsContext.Provider>;
};

export const useBusterAssetsContextSelector = <T,>(
  selector: (state: ReturnType<typeof useBusterAssets>) => T
) => useContextSelector(BusterAssetsContext, selector);

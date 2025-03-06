import { useMemoizedFn } from 'ahooks';
import React, { useCallback } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';

const useBusterAssets = () => {
  const [assetsToPasswords, setAssetsToPasswords] = React.useState<Record<string, string>>({});
  const [assetsPasswordErrors, setAssetsPasswordErrors] = React.useState<
    Record<string, string | null>
  >({});

  const setAssetPassword = useMemoizedFn((assetId: string, password: string) => {
    setAssetsToPasswords((prev) => ({ ...prev, [assetId]: password }));
    removeAssetPasswordError(assetId);
  });

  const getAssetPassword = useCallback(
    (
      assetId: string
    ): {
      password: undefined | string;
      error: string | null;
    } => {
      return {
        password: assetsToPasswords[assetId] || undefined,
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

  return { setAssetPasswordError, removeAssetPasswordError, setAssetPassword, getAssetPassword };
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

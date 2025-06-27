'use client';

import React, { useMemo } from 'react';
import type { ShareAssetType } from '@/api/asset_interfaces';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import { AppNoPageAccess } from '@/controllers/AppNoPageAccess';
import { AppPasswordAccess } from '@/controllers/AppPasswordAccess';
import { useGetAsset } from './useGetAsset';
import { useChatIndividualContextSelector } from '../ChatLayout/ChatContext';
import { useDocumentTitle } from '@/hooks';

export type AppAssetCheckLayoutProps = {
  assetId: string;
  type: 'metric' | 'dashboard' | 'collection';
  versionNumber?: number;
};

export const AppAssetCheckLayout: React.FC<
  {
    children: React.ReactNode;
  } & AppAssetCheckLayoutProps
> = React.memo(({ children, type, assetId, versionNumber }) => {
  const {
    hasAccess,
    passwordRequired,
    isPublic,
    isFetched,
    showLoader,
    title: assetTitle
  } = useGetAsset({
    assetId,
    type,
    versionNumber
  });
  const chatTitle = useChatIndividualContextSelector((x) => x.chatTitle);

  const Component = useMemo(() => {
    if (!isFetched) return null;

    if (!hasAccess && !isPublic) {
      return <AppNoPageAccess assetId={assetId} />;
    }

    if (isPublic && passwordRequired) {
      return (
        <AppPasswordAccess assetId={assetId} type={type as ShareAssetType}>
          {children}
        </AppPasswordAccess>
      );
    }

    return <>{children}</>;
  }, [isFetched, hasAccess, isPublic, passwordRequired, assetId, type, children]);

  const title = useMemo(() => {
    if (chatTitle) return [chatTitle, assetTitle].filter(Boolean).join(' | ');
    return assetTitle;
  }, [chatTitle, assetTitle]);

  useDocumentTitle(title);

  return (
    <>
      {showLoader && <FileIndeterminateLoader />}
      {Component}
    </>
  );
});

AppAssetCheckLayout.displayName = 'AppAssetCheckLayout';

import type { AssetType } from '@buster/server-shared/assets';
import type { ResponseMessageFileType } from '@buster/server-shared/chats';
import { useParams, useSearch } from '@tanstack/react-router';
import type React from 'react';
import { FileIndeterminateLoader } from '@/components/features/loaders/FileIndeterminateLoader';
import { AppNoPageAccess } from '@/controllers/AppNoPageAccess';
import { AppPasswordAccess } from '@/controllers/AppPasswordAccess';
import { AppAssetNotFound } from '../../controllers/AppAssetNotFound';
import { getAssetIdAndVersionNumber } from './getAssetIdAndVersionNumberServer';
import { useGetAssetPasswordConfig } from './useGetAssetPasswordConfig';
import { useShowLoader } from './useShowLoader';

export type AppAssetCheckLayoutProps = {
  assetType: AssetType | ResponseMessageFileType;
};

export const AppAssetCheckLayout: React.FC<
  {
    children: React.ReactNode;
  } & AppAssetCheckLayoutProps
> = ({ children, assetType }) => {
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const { assetId, versionNumber } = getAssetIdAndVersionNumber(assetType, params, search);
  const { hasAccess, isPublic, passwordRequired, isFetched } = useGetAssetPasswordConfig(
    assetId,
    assetType,
    versionNumber
  );

  const showLoader = useShowLoader(assetId, assetType, versionNumber);

  let content: React.ReactNode;

  if (!isFetched) {
    return null;
  } else if (!assetId || !assetType) {
    return <AppAssetNotFound assetId={assetId} type={assetType} />;
  } else if (isPublic && passwordRequired && !hasAccess) {
    content = (
      <AppPasswordAccess assetId={assetId} type={assetType}>
        {children}
      </AppPasswordAccess>
    );
  } else if (!hasAccess) {
    content = <AppNoPageAccess assetId={assetId} type={assetType} />;
  } else {
    content = children;
  }

  return (
    <>
      {showLoader && <FileIndeterminateLoader />}
      {content}
    </>
  );
};

AppAssetCheckLayout.displayName = 'AppAssetCheckLayout';

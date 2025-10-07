import type { SearchTextData } from '@buster/server-shared/search';
import type React from 'react';

export type GlobalSearchSecondaryContentProps = {
  selectedItem: SearchTextData;
};

export const GlobalSearchSecondaryContent: React.FC<GlobalSearchSecondaryContentProps> = ({
  selectedItem,
}) => {
  const { assetId, assetType, title, ancestors, updatedAt, screenshotBucketKey } = selectedItem;
  return <div>GlobalSearchSecondaryContent</div>;
};

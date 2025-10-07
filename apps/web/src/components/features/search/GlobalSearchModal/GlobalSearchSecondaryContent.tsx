import type { SearchTextData } from '@buster/server-shared/search';
import type React from 'react';
import SkeletonSearchChat from '@/assets/png/skeleton-search-chat.png';
import SkeletonSearchDashboard from '@/assets/png/skeleton-search-dashboard.png';
import SkeletonSearchMetric from '@/assets/png/skeleton-search-metric.png';
import SkeletonSearchReport from '@/assets/png/skeleton-search-report.png';

export type GlobalSearchSecondaryContentProps = {
  selectedItem: SearchTextData;
};

export const GlobalSearchSecondaryContent: React.FC<GlobalSearchSecondaryContentProps> = ({
  selectedItem,
}) => {
  const {
    assetId,
    assetType,
    title,
    ancestors,
    updatedAt,
    screenshotBucketKey,
    screenshotUrl,
    createdBy,
  } = selectedItem;
  console.log(selectedItem);
  return (
    <div className="p-3 min-w-[420px] min-h-[420px]">
      <ScreenshotImage screenshotUrl={screenshotUrl} assetType={assetType} />
    </div>
  );
};

const ScreenshotImage = ({
  screenshotUrl,
  assetType,
}: {
  screenshotUrl: string | null | undefined;
  assetType: SearchTextData['assetType'];
}) => {
  let imageUrl = screenshotUrl;
  if (!imageUrl) {
    if (assetType === 'chat') {
      imageUrl = SkeletonSearchChat;
    } else if (assetType === 'metric_file') {
      imageUrl = SkeletonSearchMetric;
    } else if (assetType === 'dashboard_file') {
      imageUrl = SkeletonSearchDashboard;
    } else if (assetType === 'report_file') {
      imageUrl = SkeletonSearchReport;
    } else if (assetType === 'collection') {
      imageUrl = SkeletonSearchMetric;
    } else {
      const _exhaustiveCheck: never = assetType;
    }
  }
  return (
    <img
      src={screenshotUrl || SkeletonSearchMetric}
      alt="Screenshot"
      className="w-full h-full object-cover"
    />
  );
};

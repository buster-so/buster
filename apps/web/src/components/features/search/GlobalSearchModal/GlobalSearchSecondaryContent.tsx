import type { SearchTextData } from '@buster/server-shared/search';
import { motion } from 'framer-motion';
import type React from 'react';
import { useState } from 'react';
import SkeletonSearchChat from '@/assets/png/skeleton-screenshot-chat.png';
import SkeletonSearchDashboard from '@/assets/png/skeleton-screenshot-dashboard.png';
import SkeletonSearchMetric from '@/assets/png/skeleton-screenshot-metric.png';
import SkeletonSearchReport from '@/assets/png/skeleton-screenshot-report.png';
import { CircleSpinnerLoader } from '@/components/ui/loaders';

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  let fallbackImageUrl = '';
  if (assetType === 'chat') {
    fallbackImageUrl = SkeletonSearchChat;
  } else if (assetType === 'metric_file') {
    fallbackImageUrl = SkeletonSearchMetric;
  } else if (assetType === 'dashboard_file') {
    fallbackImageUrl = SkeletonSearchDashboard;
  } else if (assetType === 'report_file') {
    fallbackImageUrl = SkeletonSearchReport;
  } else if (assetType === 'collection') {
    fallbackImageUrl = SkeletonSearchMetric;
  } else {
    const _exhaustiveCheck: never = assetType;
  }

  const imageUrl = hasError || !screenshotUrl ? fallbackImageUrl : screenshotUrl;

  return (
    <div
      className="bg-background rounded border overflow-hidden w-full h-full relative"
      style={{
        height: '240px',
        maxHeight: '240px',
        minHeight: '240px',
      }}
    >
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 1 }}
        animate={{ opacity: isLoaded ? 0 : 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <CircleSpinnerLoader size={18} />
      </motion.div>
      <motion.img
        src={imageUrl}
        alt="Screenshot"
        className="w-full h-full object-cover object-top"
        initial={{ opacity: 0, filter: 'blur(4px)' }}
        animate={{ opacity: isLoaded ? 1 : 0, filter: isLoaded ? 'blur(0px)' : 'blur(4px)' }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
      />
    </div>
  );
};

import type { SearchTextData } from '@buster/server-shared/search';
import { motion } from 'framer-motion';
import type React from 'react';
import { useEffect, useLayoutEffect, useState } from 'react';
import SkeletonSearchChat from '@/assets/png/skeleton-screenshot-chat.png';
import SkeletonSearchDashboard from '@/assets/png/skeleton-screenshot-dashboard.png';
import SkeletonSearchMetric from '@/assets/png/skeleton-screenshot-metric.png';
import SkeletonSearchReport from '@/assets/png/skeleton-screenshot-report.png';
import { Avatar } from '@/components/ui/avatar';
import { CircleSpinnerLoader } from '@/components/ui/loaders';
import { formatDate } from '@/lib/date';

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
    <div className="p-3 min-w-[420px] min-h-[420px] flex flex-col gap-y-3">
      <ScreenshotImage screenshotUrl={screenshotUrl} assetType={assetType} />
      <MetaContent
        assetType={assetType}
        title={title}
        updatedAt={updatedAt}
        createdBy={createdBy}
      />

      <hr className="border-t" />
    </div>
  );
};

function getFallback(assetType: SearchTextData['assetType']) {
  switch (assetType) {
    case 'chat':
      return SkeletonSearchChat;
    case 'metric_file':
      return SkeletonSearchMetric;
    case 'dashboard_file':
      return SkeletonSearchDashboard;
    case 'report_file':
      return SkeletonSearchReport;
    case 'collection':
      return SkeletonSearchMetric;
    default:
      return SkeletonSearchMetric;
  }
}

const ScreenshotImage = ({
  screenshotUrl,
  assetType,
}: {
  screenshotUrl: string | null | undefined;
  assetType: SearchTextData['assetType'];
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fallbackImageUrl = getFallback(assetType);
  const imageUrl = hasError || !screenshotUrl ? fallbackImageUrl : screenshotUrl;

  useLayoutEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.src = imageUrl;

    if (img.complete && img.naturalHeight !== 0) {
      // Already cached
      setIsCached(true);
      setIsLoaded(true);
    } else {
      img.onload = () => setIsLoaded(true);
      img.onerror = () => {
        setHasError(true);
        setIsLoaded(true);
      };
    }
  }, [imageUrl]);

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
        key={imageUrl}
        src={imageUrl}
        alt="Screenshot"
        className="w-full h-full object-cover object-top"
        initial={
          isCached ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(4px)' }
        }
        animate={
          isLoaded ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(4px)' }
        }
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />
    </div>
  );
};

const MetaContent = ({
  assetType,
  title,
  updatedAt,
  createdBy,
}: Pick<SearchTextData, 'assetType' | 'title' | 'updatedAt' | 'createdBy'>) => {
  const PillContainer = ({ children }: { children: React.ReactNode }) => {
    return (
      <div className="flex items-center leading-none gap-1 text-secondary border rounded h-6 px-1">
        {children}
      </div>
    );
  };

  console.log(createdBy);

  return (
    <div className="flex flex-wrap gap-1">
      {createdBy && (
        <PillContainer>
          <Avatar image={createdBy.avatarUrl} size={12} />
          {createdBy?.name}
        </PillContainer>
      )}
      <PillContainer>
        {formatDate({
          date: updatedAt,
          format: 'lll',
        })}
      </PillContainer>
    </div>
  );
};

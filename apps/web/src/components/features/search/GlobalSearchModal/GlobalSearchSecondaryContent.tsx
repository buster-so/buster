/** biome-ignore-all lint/complexity/noUselessFragments:it is okay */
/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: I know what I'm doing mom */
import type { AssetType } from '@buster/server-shared/assets';
import type { SearchTextData } from '@buster/server-shared/search';
import { Link, type LinkProps, useRouter } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useLayoutEffect, useState } from 'react';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import SkeletonSearchChat from '@/assets/png/skeleton-screenshot-chat.png';
import SkeletonSearchDashboard from '@/assets/png/skeleton-screenshot-dashboard.png';
import SkeletonSearchMetric from '@/assets/png/skeleton-screenshot-metric.png';
import SkeletonSearchReport from '@/assets/png/skeleton-screenshot-report.png';
import { CircleSpinnerLoader } from '@/components/ui/loaders';
import { formatDate } from '@/lib/date';
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import { cn } from '@/lib/utils';
import { ASSET_ICONS } from '../../icons/assetIcons';
import { MetricChartCard } from '../../metrics/MetricChartCard';

export type GlobalSearchSecondaryContentProps = {
  selectedItem: SearchTextData;
};

export const GlobalSearchSecondaryContent: React.FC<GlobalSearchSecondaryContentProps> = ({
  selectedItem,
}) => {
  const { assetId, assetType, title, ancestors, updatedAt, screenshotUrl, createdBy } =
    selectedItem;

  return (
    <div className="px-3 pt-3 pb-3 min-w-[420px] min-h-[420px] flex flex-col gap-y-3 flex-1 h-full">
      {assetType === 'metric_file' ? (
        <MetricScreenshotContainer assetId={assetId} screenshotUrl={screenshotUrl} />
      ) : (
        <ScreenshotImage screenshotUrl={screenshotUrl} assetType={assetType} />
      )}

      <MetaContent updatedAt={updatedAt} createdBy={createdBy} />

      <hr className="border-t" />

      <Ancestors ancestors={ancestors} title={title} type={assetType} assetId={assetId} />
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
        transition={{ duration: 0.165, ease: 'easeOut' }}
      />
    </div>
  );
};

const MetricScreenshotContainer = ({
  assetId,
  screenshotUrl,
}: {
  assetId: SearchTextData['assetId'];
  screenshotUrl: SearchTextData['screenshotUrl'];
}) => {
  const { isFetched: isFetchedMetric, isError: isErrorMetric } = useGetMetric({
    id: assetId,
    versionNumber: 'LATEST',
  });
  const { isFetched: isFetchedMetricData, isError: isErrorMetricData } = useGetMetricData({
    id: assetId,
    versionNumber: 'LATEST',
  });

  const isLoadingContent =
    (!isFetchedMetric || !isFetchedMetricData) && !isErrorMetric && !isErrorMetricData;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="h-[280px]"
        key={isLoadingContent ? 'loading' : 'content'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {isLoadingContent ? (
          <ScreenshotImage screenshotUrl={screenshotUrl} assetType={'metric_file'} />
        ) : (
          <MetricChartCard
            metricId={assetId}
            versionNumber={undefined}
            animate={false}
            readOnly
            useHeaderLink={false}
            disableTooltip={true}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

const MetaContent = ({ updatedAt, createdBy }: Pick<SearchTextData, 'updatedAt' | 'createdBy'>) => {
  const PillContainer = ({ children }: { children: React.ReactNode }) => {
    return (
      <div
        className="flex bg-background items-center gap-1 text-secondary border rounded h-4.5 px-1 text-xs"
        style={{
          lineHeight: 0,
        }}
      >
        {children}
      </div>
    );
  };

  return (
    <div className="flex flex-wrap gap-1">
      {createdBy && (
        <PillContainer>
          <img
            src={createdBy.avatarUrl ?? ''}
            alt="Avatar"
            className="w-3 h-3 rounded-full border object-contain bg-gray-light/50"
            style={{ objectFit: 'contain' }}
          />

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

const Translation: Record<AssetType, string> = {
  chat: 'Chat',
  dashboard_file: 'Dashboard',
  report_file: 'Report',
  collection: 'Collection',
  metric_file: 'Metric',
};

const Ancestors = React.memo(
  ({
    ancestors,
    title,
    type,
    assetId,
  }: {
    ancestors: SearchTextData['ancestors'];
    title: string;
    type: AssetType;
    assetId: string;
  }) => {
    if (!ancestors) return null;

    const { chats, collections, dashboards, reports } = ancestors;

    type AncestorObject = {
      type: AssetType;
      title: string;
      id: string;
      secondaryText: string;
      isMain?: boolean;
    };

    const AncestorContainer = ({ isMain, type, title, secondaryText }: AncestorObject) => {
      let Icon = <ASSET_ICONS.metrics />;
      const router = useRouter();

      if (type === 'chat') {
        Icon = <ASSET_ICONS.chats />;
      } else if (type === 'dashboard_file') {
        Icon = <ASSET_ICONS.dashboards />;
      } else if (type === 'report_file') {
        Icon = <ASSET_ICONS.reports />;
      } else if (type === 'collection') {
        Icon = <ASSET_ICONS.collections />;
      } else if (type === 'metric_file') {
        Icon = <ASSET_ICONS.metrics />;
      } else {
        const _exhaustiveCheck: never = type;
      }

      const LinkWrapper = ({ children }: { children: React.ReactNode | React.ReactNode[] }) => {
        if (isMain || !router) {
          return <>{children}</>;
        }
        const link = createSimpleAssetRoute({
          asset_type: type,
          id: assetId,
        }) as LinkProps;

        return (
          <Link {...link} preload={false}>
            {children}
          </Link>
        );
      };

      return (
        <LinkWrapper>
          <React.Fragment>
            <div
              style={{
                lineHeight: 0,
              }}
              className={cn(
                'flex gap-1 items-center text-gray-light first:text-gray-dark hover:text-gray-dark',
                !isMain && router && 'cursor-pointer',
                'text-xs h-3.5'
              )}
            >
              <span>{Icon}</span>
              <span dangerouslySetInnerHTML={{ __html: title }} />
              <span>{'•'}</span>
              {secondaryText}
            </div>
          </React.Fragment>
        </LinkWrapper>
      );
    };

    const allAncestors: AncestorObject[] = [
      {
        type,
        title,
        id: assetId,
        secondaryText: Translation[type],
        isMain: true,
      },
      ...reports.map((r) => ({
        ...r,
        type: 'report_file' as const,
        secondaryText: 'Parent Report',
      })),
      ...dashboards.map((d) => ({
        ...d,
        type: 'dashboard_file' as const,
        secondaryText: 'Parent Dashboard',
      })),
      ...chats.map((c) => ({ ...c, type: 'chat' as const, secondaryText: 'Parent Chat' })),
      ...collections.map((c) => ({
        ...c,
        type: 'collection' as const,
        secondaryText: 'Parent Collection',
      })),
    ];

    const lastItemIndex = allAncestors.length - 1;

    return (
      <div className="flex flex-col gap-y-[1px] flex-1 overflow-y-auto">
        {allAncestors.map((ancestor, index) => (
          <React.Fragment key={ancestor.id}>
            <AncestorContainer {...ancestor} />
            {index < lastItemIndex && (
              <div className="flex items-start justify-start ml-[5px]">
                <div className="border-l min-h-2" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }
);

Ancestors.displayName = 'Ancestors';

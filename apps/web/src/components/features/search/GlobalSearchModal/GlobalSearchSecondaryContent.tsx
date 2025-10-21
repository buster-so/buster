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
import InfoCircle from '@/components/ui/icons/NucleoIconOutlined/circle-info';
import { CircleSpinnerLoader } from '@/components/ui/loaders';
import { Tooltip } from '@/components/ui/tooltip';
import { useMount } from '@/hooks/useMount';
import { useSetTimeout } from '@/hooks/useSetTimeout';
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
  const {
    assetId,
    assetType,
    title,
    ancestors,
    updatedAt,
    screenshotUrl,
    createdBy,
    createdByAvatarUrl,
    createdByName,
  } = selectedItem;

  return (
    <div className="px-3 pt-3 pb-3 min-w-[420px] min-h-[420px] flex flex-col gap-y-3 flex-1 h-full">
      {assetType === 'metric_file' ? (
        <MetricScreenshotContainer key={assetId} assetId={assetId} screenshotUrl={screenshotUrl} />
      ) : (
        <ScreenshotImage
          screenshotUrl={screenshotUrl}
          assetType={assetType}
          key={`${screenshotUrl}-image`}
        />
      )}

      <MetaContent
        updatedAt={updatedAt}
        createdBy={createdBy}
        createdByAvatarUrl={createdByAvatarUrl}
        createdByName={createdByName}
        screenshotUrl={screenshotUrl}
      />

      <hr className="border-t" />

      <Ancestors ancestors={ancestors} title={title} type={assetType} assetId={assetId} />
    </div>
  );
};

function getFallback(assetType: SearchTextData['assetType']) {
  if (assetType === 'metric_file') {
    return SkeletonSearchMetric;
  } else if (assetType === 'chat') {
    return SkeletonSearchChat;
  } else if (assetType === 'dashboard_file') {
    return SkeletonSearchDashboard;
  } else if (assetType === 'report_file') {
    return SkeletonSearchReport;
  } else if (assetType === 'collection') {
    return SkeletonSearchMetric;
  } else {
    const _exhaustiveCheck: never = assetType;
    console.warn('Exhaustive check', _exhaustiveCheck);
    return SkeletonSearchMetric;
  }
}

const ScreenshotImage = ({
  screenshotUrl,
  assetType,
  className,
}: {
  screenshotUrl: string | null | undefined;
  assetType: SearchTextData['assetType'];
  className?: string;
}) => {
  const fallbackImageUrl = getFallback(assetType);
  const initialImageUrl = !screenshotUrl ? fallbackImageUrl : screenshotUrl;

  // Check if image is already cached synchronously during initialization
  const checkIfCached = (url: string) => {
    const img = new Image();
    img.src = url;
    return img.complete && img.naturalHeight !== 0;
  };

  const [isLoaded, setIsLoaded] = useState(() => checkIfCached(initialImageUrl));
  const [hasError, setHasError] = useState(false);

  const imageUrl = hasError || !screenshotUrl ? fallbackImageUrl : screenshotUrl;

  useLayoutEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.src = imageUrl;

    if (img.complete && img.naturalHeight !== 0) {
      // Already cached
      setIsLoaded(true);
    } else {
      // Not cached yet, wait for load
      setIsLoaded(false);
      img.onload = () => {
        setIsLoaded(true);
      };
      img.onerror = (e) => {
        console.error('Error loading image', e, imageUrl);
        setHasError(true);
        setIsLoaded(true);
      };
    }
  }, [imageUrl]);

  console.log(isLoaded, assetType);

  return (
    <div className="bg-background rounded border overflow-hidden w-full relative aspect-video">
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
        className={cn('w-full h-full object-cover object-top', className)}
        initial={
          isLoaded ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(4px)' }
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
  const [canFetchData, setCanFetchData] = useState(false);
  const { isFetched: isFetchedMetric, isError: isErrorMetric } = useGetMetric({
    id: assetId,
    versionNumber: 'LATEST',
  });
  const { isFetched: isFetchedMetricData, isError: isErrorMetricData } = useGetMetricData(
    { id: assetId, versionNumber: 'LATEST' },
    { enabled: canFetchData }
  );

  const isLoadingContent =
    !isFetchedMetric || !isFetchedMetricData || isErrorMetric || isErrorMetricData;

  useSetTimeout(() => {
    setCanFetchData(true);
  }, 1250);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="aspect-video"
        key={isLoadingContent ? 'loading' : 'content'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {isLoadingContent ? (
          <ScreenshotImage
            screenshotUrl={screenshotUrl}
            assetType={'metric_file'}
            className={cn(canFetchData && 'animate-pulse')}
            key={`${screenshotUrl}-image`} //force re-render when the assetId changes
          />
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

const PillContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'flex bg-background items-center gap-1 text-secondary border rounded h-4.5 px-1 text-xs',
        className
      )}
      style={{
        lineHeight: 0,
      }}
    >
      {children}
    </div>
  );
};

const MetaContent = ({
  updatedAt,
  createdBy,
  createdByAvatarUrl,
  createdByName,
  screenshotUrl,
}: Pick<
  SearchTextData,
  'updatedAt' | 'createdBy' | 'createdByAvatarUrl' | 'createdByName' | 'screenshotUrl'
>) => {
  return (
    <div className="flex flex-wrap gap-1">
      {createdBy && (
        <PillContainer>
          {createdByAvatarUrl && (
            <img
              src={createdByAvatarUrl ?? ''}
              alt="Avatar"
              className="w-3 h-3 rounded-full border object-contain bg-gray-light/50"
              style={{ objectFit: 'contain' }}
            />
          )}

          {createdByName}
        </PillContainer>
      )}
      <PillContainer>
        {formatDate({
          date: updatedAt,
          format: 'lll',
        })}
      </PillContainer>
      {!screenshotUrl && (
        <Tooltip title="Thumbnail will be available after the asset is loaded.">
          <PillContainer className="hover:bg-item-hover">
            <div className="text-icon-color cursor-help">
              <InfoCircle />
            </div>
          </PillContainer>
        </Tooltip>
      )}
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

type AncestorObject = {
  type: AssetType;
  title: string;
  id: string;
  secondaryText: string;
  isMain?: boolean;
};

const AncestorContainer = ({ isMain, type, title, secondaryText, id }: AncestorObject) => {
  const router = useRouter();

  let Icon = <ASSET_ICONS.metrics />;

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
    if (!router) {
      return <>{children}</>;
    }
    const link = createSimpleAssetRoute({
      asset_type: type,
      id,
    }) as LinkProps;

    return (
      <Link {...link} preload={false} reloadDocument>
        {children}
      </Link>
    );
  };

  return (
    <LinkWrapper>
      <React.Fragment>
        <div
          style={{
            lineHeight: 1,
          }}
          className={cn(
            'flex gap-1 items-center text-gray-light first:text-gray-dark hover:text-gray-dark',
            !isMain && router && 'cursor-pointer hover:text-foreground hover:underline',
            'text-xs h-3.5 overflow-hidden '
          )}
        >
          <span className="shrink-0">{Icon}</span>
          <span dangerouslySetInnerHTML={{ __html: `${title}` }} className="truncate min-w-0" />
          <span className="shrink-0">{'•'}</span>
          <span className="shrink-0 mr-0.5">{secondaryText}</span>
        </div>
      </React.Fragment>
    </LinkWrapper>
  );
};

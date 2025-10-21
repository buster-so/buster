import type { SearchTextData } from '@buster/server-shared/search';
import SkeletonSearchChat from '@/assets/png/skeleton-screenshot-chat.png';
import SkeletonSearchDashboard from '@/assets/png/skeleton-screenshot-dashboard.png';
import SkeletonSearchMetric from '@/assets/png/skeleton-screenshot-metric.png';
import SkeletonSearchReport from '@/assets/png/skeleton-screenshot-report.png';

export function getScreenshotSkeleton(assetType: SearchTextData['assetType']) {
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

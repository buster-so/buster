import type { BusterRoutes } from '@/routes';
import type { FileConfig, FileView, FileViewSecondary } from './interfaces';
import { getFileViewFromRoute } from '../helpers';

export const initializeFileViews = ({
  metricId,
  dashboardId,
  currentRoute,
  secondaryView
}: {
  metricId: string | undefined;
  dashboardId: string | undefined;
  currentRoute: BusterRoutes;
  secondaryView: FileViewSecondary | undefined;
}): Record<string, FileConfig> => {
  if (metricId) {
    const selectedFileView: FileView = getFileViewFromRoute(currentRoute) || 'chart';

    return {
      [metricId]: {
        selectedFileView,
        fileViewConfig: {
          [selectedFileView]: {
            secondaryView
          }
        }
      }
    };
  }

  if (dashboardId) {
    const selectedFileView: FileView = getFileViewFromRoute(currentRoute) || 'dashboard';
    return {
      [dashboardId]: {
        selectedFileView,
        fileViewConfig: {
          [selectedFileView]: {
            secondaryView
          }
        }
      }
    };
  }

  return {};
};

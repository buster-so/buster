import React, { useMemo } from 'react';
import { useRemoveMetricsFromDashboard } from '@/api/buster_rest/dashboards';
import { useGetMetric } from '@/api/buster_rest/metrics';
import {
  useFavoriteMetricSelectMenu,
  useMetricDrilldownItem,
  useMetricVersionHistorySelectMenu,
  useNavigateToDashboardMetricItem,
  useOpenChartItem,
  useRenameMetricOnPage,
} from '@/components/features/metrics/threeDotMenuHooks';
import { getShareAssetConfig } from '@/components/features/ShareMenu/helpers';
import { ShareMenuContent } from '@/components/features/ShareMenu/ShareMenuContent';
import type { IDropdownItem, IDropdownItems } from '@/components/ui/dropdown';
import { PenSparkle, ShareRight, Trash } from '@/components/ui/icons';
import { useStartChatFromAsset } from '@/context/BusterAssets/useStartChatFromAsset';
import { getIsEffectiveOwner } from '@/lib/share';

export const useDashboardMetricCardThreeDotMenuItems = ({
  dashboardId,
  metricId,
  metricVersionNumber,
  dashboardVersionNumber,
}: {
  dashboardId: string;
  metricId: string;
  metricVersionNumber: number | undefined;
  dashboardVersionNumber: number | undefined;
}) => {
  const removeFromDashboardItem = useRemoveFromDashboardItem({ dashboardId, metricId });
  const openChartItem = useOpenChartItem({ metricId, metricVersionNumber });
  const drilldownItem = useMetricDrilldownItem({ metricId });
  const shareMenu = useShareMenuSelectMenu({ metricId, metricVersionNumber });
  const editWithAI = useEditWithAI({ metricId });
  const navigateToDashboardMetricItem = useNavigateToDashboardMetricItem({
    metricId,
    metricVersionNumber,
    dashboardId,
    dashboardVersionNumber,
  });
  const versionHistoryButton = useMetricVersionHistorySelectMenu({ metricId });
  const favoriteMetricButton = useFavoriteMetricSelectMenu({
    metricId,
    versionNumber: metricVersionNumber,
  });
  const renameMetric = useRenameMetricOnPage({ metricId, metricVersionNumber });

  const dropdownItems: IDropdownItems = useMemo(
    () =>
      [
        openChartItem,
        removeFromDashboardItem,
        { type: 'divider' },
        editWithAI,
        { type: 'divider' },
        // shareMenu,
        ...navigateToDashboardMetricItem,
        // versionHistoryButton,
        //TODO add DOWNLOAD CSV
        //TODO add DOWNLOAD PNG
        { type: 'divider' },
        renameMetric,
        //  favoriteMetricButton,
        //TODO add rename ability
      ].filter(Boolean) as IDropdownItems,
    [
      removeFromDashboardItem,
      openChartItem,
      drilldownItem,
      shareMenu,
      editWithAI,
      navigateToDashboardMetricItem,
      versionHistoryButton,
      favoriteMetricButton,
    ]
  );

  return dropdownItems;
};

const useRemoveFromDashboardItem = ({
  dashboardId,
  metricId,
}: {
  dashboardId: string;
  metricId: string;
}): IDropdownItem => {
  const { mutateAsync: removeMetricFromDashboard, isPending } = useRemoveMetricsFromDashboard();

  return useMemo(
    () => ({
      value: 'delete',
      label: 'Remove from dashboard',
      icon: <Trash />,
      loading: isPending,
      onClick: async () => {
        await removeMetricFromDashboard({
          dashboardId,
          metricIds: [metricId],
        });
      },
    }),
    [dashboardId, metricId, removeMetricFromDashboard, isPending]
  );
};

const useShareMenuSelectMenu = ({
  metricId,
  metricVersionNumber,
}: {
  metricId: string;
  metricVersionNumber: number | undefined;
}): IDropdownItem | undefined => {
  const { data: shareAssetConfig } = useGetMetric(
    { id: metricId, versionNumber: metricVersionNumber },
    { select: getShareAssetConfig }
  );
  const isEffectiveOwner = getIsEffectiveOwner(shareAssetConfig?.permission);

  return useMemo(
    () =>
      isEffectiveOwner && shareAssetConfig
        ? {
            label: 'Share metric',
            value: 'share-metric',
            icon: <ShareRight />,
            disabled: !isEffectiveOwner,
            items:
              isEffectiveOwner && shareAssetConfig
                ? [
                    <ShareMenuContent
                      key={metricId}
                      shareAssetConfig={shareAssetConfig}
                      assetId={metricId}
                      assetType={'metric_file'}
                    />,
                  ]
                : undefined,
          }
        : undefined,
    [metricId, shareAssetConfig, isEffectiveOwner]
  );
};

const useEditWithAI = ({ metricId }: { metricId: string }): IDropdownItem => {
  const { onCreateFileClick, loading } = useStartChatFromAsset({
    assetId: metricId,
    assetType: 'metric_file',
  });

  return useMemo(
    () => ({
      label: 'Edit with AI',
      value: 'edit-with-ai',
      icon: <PenSparkle />,
      loading: loading,
      onClick: async () => {
        await onCreateFileClick();
      },
    }),
    [metricId, onCreateFileClick, loading]
  );
};

// const useViewResultsButton = ({
//   metricId,
//   dashboardId,
//   metricVersionNumber,
// }: {
//   metricId: string;
//   dashboardId: string;
//   chatId: string | undefined;
//   metricVersionNumber: number | undefined;
// }): IDropdownItem => {
//   return useMemo(
//     () =>
//       createDropdownItem({
//         label: 'View results',
//         value: 'view-results',
//         icon: <ASSET_ICONS.table />,
//         link: {
//           to: '/app/dashboards/$dashboardId/metrics/$metricId/results',
//           params: {
//             dashboardId,
//             metricId,
//           },
//           search: {
//             metric_version_number: metricVersionNumber,
//           },
//         },
//       }),
//     [metricId, dashboardId, metricVersionNumber]
//   );
// };

// const useViewSQLButton = ({
//   metricId,
//   dashboardId,
//   chatId,
//   metricVersionNumber,
// }: {
//   metricId: string;
//   dashboardId: string;
//   chatId: string | undefined;
//   metricVersionNumber: number | undefined;
// }): IDropdownItem => {
//   return useMemo(
//     () =>
//       createDropdownItem({
//         label: 'View SQL',
//         value: 'view-sql',
//         icon: <Code />,
//         link: {
//           to: '/app/dashboards/$dashboardId/metrics/$metricId/sql',
//           params: {
//             dashboardId,
//             metricId,
//           },
//           search: {
//             metric_version_number: metricVersionNumber,
//           },
//         },
//       }),
//     [metricId, dashboardId, chatId]
//   );
// };

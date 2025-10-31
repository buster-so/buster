import { useNavigate } from '@tanstack/react-router';
import React, { useCallback, useMemo, useState } from 'react';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { useDownloadMetricFile, useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import {
  createDropdownItems,
  DropdownContent,
  type IDropdownItem,
  type IDropdownItems,
} from '@/components/ui/dropdown';
import {
  ArrowUpRight,
  Code,
  Download4,
  Edit,
  History,
  Image,
  PenSparkle,
  ShareRight,
  SquareChartPen,
  Table,
} from '@/components/ui/icons';
import { createMenuItem } from '@/components/ui/menu-shared';
import { useStartChatFromAsset } from '@/context/BusterAssets/useStartChatFromAsset';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { ensureElementExists } from '@/lib/element';
import { downloadElementToImage } from '@/lib/exportUtils';
import { canEdit, getIsEffectiveOwner } from '../../../lib/share';
import { FollowUpWithAssetContent } from '../assets/FollowUpWithAsset';
import { createFavoriteMenuItem, useFavoriteStar } from '../favorites';
import { ShareMenuContent } from '../ShareMenu';
import { getShareAssetConfig } from '../ShareMenu/helpers';
import { useListMetricVersionDropdownItems } from '../versionHistory/useListMetricVersionDropdownItems';
import { METRIC_CHART_CONTAINER_ID } from './MetricChartCard/config';
import { METRIC_CHART_TITLE_INPUT_ID } from './MetricChartCard/MetricViewChartHeader';

export const useMetricVersionHistorySelectMenu = ({
  metricId,
}: {
  metricId: string;
}): IDropdownItem => {
  const { data } = useGetMetric(
    { id: metricId, versionNumber: 'LATEST' },
    {
      select: useCallback(
        (x: BusterMetric) => ({
          versions: x.versions,
          version_number: x.version_number,
        }),
        []
      ),
    }
  );
  const { versions = [], version_number } = data || {};

  const versionHistoryItems: IDropdownItems = useListMetricVersionDropdownItems({
    versions,
    selectedVersion: version_number,
  });

  return useMemo(
    () => ({
      label: 'Version history',
      value: 'version-history',
      icon: <History />,
      selectType: 'none',
      items: [
        <DropdownContent
          key="version-history-sub-menu"
          items={versionHistoryItems}
          selectType="single-selectable-link"
        />,
      ],
    }),
    [versionHistoryItems]
  );
};

export const useFavoriteMetricSelectMenu = ({
  metricId,
  versionNumber,
}: {
  metricId: string;
  versionNumber: number | undefined;
}) => {
  const { data: name } = useGetMetric(
    { id: metricId, versionNumber },
    { select: useCallback((x: BusterMetric) => x.name, []) }
  );
  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id: metricId,
    type: 'metric_file',
    name: name || '',
  });

  return useMemo(
    () =>
      createFavoriteMenuItem({
        isFavorited,
        onFavoriteClick,
      }),
    [isFavorited, onFavoriteClick]
  );
};

export const useMetricDrilldownItem = ({ metricId }: { metricId: string }): IDropdownItem => {
  return useMemo(
    () => ({
      value: 'drilldown',
      label: 'Drill down & filter',
      items: [
        <FollowUpWithAssetContent
          key="drilldown-and-filter"
          assetType="metric_file"
          assetId={metricId}
          placeholder="Describe how you want to drill down or filter..."
          buttonText="Submit request"
        />,
      ],
      icon: <PenSparkle />,
    }),
    [metricId]
  );
};

export const useRenameMetricOnPage = ({
  metricId,
  metricVersionNumber,
  isNotMetricPage = false,
}: {
  metricId: string;
  metricVersionNumber: number | undefined;
  isNotMetricPage?: boolean;
}) => {
  const navigate = useNavigate();

  return useMemo(
    () => ({
      label: 'Rename metric',
      value: 'rename-metric',
      icon: <Edit />,
      onClick: async () => {
        await navigate({
          unsafeRelative: 'path',
          to: isNotMetricPage
            ? '/app/metrics/$metricId/chart'
            : ('../chart' as '/app/metrics/$metricId/chart'),
          params: (prev) => ({ ...prev, metricId }),
          search: metricVersionNumber ? { metric_version_number: metricVersionNumber } : undefined,
        });

        const input = await ensureElementExists(
          () => document.getElementById(METRIC_CHART_TITLE_INPUT_ID) as HTMLInputElement
        );
        if (input) {
          setTimeout(() => {
            input.focus();
            input.select();
          }, 250);
        }
      },
    }),
    [navigate, metricId, metricVersionNumber]
  );
};

export const useDownloadMetricDataCSV = ({
  metricId,
  metricVersionNumber,
  cacheDataId,
}: {
  metricId: string;
  metricVersionNumber: number | undefined;
  cacheDataId?: string;
}) => {
  const { mutateAsync: handleDownload, isPending: isDownloading } = useDownloadMetricFile();

  return useMemo(
    () =>
      createMenuItem({
        type: 'item',
        label: 'Download as CSV',
        value: 'download-csv',
        icon: <Download4 />,
        loading: isDownloading,
        closeOnSelect: false,
        onClick: async () => {
          await handleDownload({
            id: metricId,
            report_file_id: cacheDataId,
            metric_version_number: metricVersionNumber,
          });
        },
      }),
    [isDownloading]
  );
};

export const useDownloadPNGSelectMenu = ({
  metricId,
  metricVersionNumber,
}: {
  metricId: string;
  metricVersionNumber: number | undefined;
}) => {
  const { openErrorMessage } = useBusterNotifications();
  const { data: name } = useGetMetric(
    { id: metricId, versionNumber: metricVersionNumber },
    { select: useCallback((x: BusterMetric) => x.name, []) }
  );
  const { data: selectedChartType } = useGetMetric(
    { id: metricId, versionNumber: metricVersionNumber },
    { select: useCallback((x: BusterMetric) => x.chart_config?.selectedChartType, []) }
  );

  const canDownload = selectedChartType && selectedChartType !== 'table';

  return useMemo(
    () => ({
      label: 'Download as PNG (coming soon)',
      value: 'download-png',
      disabled: true,
      icon: <Image />,
      onClick: async () => {
        const node = document.getElementById(METRIC_CHART_CONTAINER_ID(metricId)) as HTMLElement;
        if (node) {
          try {
            return await downloadElementToImage(node, `${name}.png`);
          } catch (error) {
            console.error(error);
          }
        }

        openErrorMessage('Failed to download PNG');
      },
    }),
    [canDownload, metricId, name, openErrorMessage]
  );
};

export const useOpenChartItem = ({
  metricId,
  metricVersionNumber,
}: {
  metricId: string;
  metricVersionNumber: number | undefined;
}) => {
  return createMenuItem({
    type: 'item',
    value: 'open-chart',
    label: 'Open chart',
    icon: <ArrowUpRight />,
    link: {
      to: '/app/metrics/$metricId/chart',
      params: {
        metricId,
      },
      search: {
        metric_version_number: metricVersionNumber,
      },
    },
    linkIcon: 'none',
  });
};

export const useNavigatetoMetricItem = ({
  metricId,
  metricVersionNumber,
}: {
  metricId: string;
  metricVersionNumber: number | undefined;
}): IDropdownItems => {
  return useMemo(() => {
    return createDropdownItems([
      {
        value: 'edit-chart',
        label: 'Edit chart',
        icon: <SquareChartPen />,
        link: {
          to: '/app/metrics/$metricId/chart',
          params: {
            metricId,
          },
          search: {
            metric_version_number: metricVersionNumber,
          },
        },
      },
      {
        value: 'results-chart',
        label: 'View results',
        icon: <Table />,
        link: {
          to: '/app/metrics/$metricId/results',
          params: {
            metricId,
          },
          search: {
            metric_version_number: metricVersionNumber,
          },
        },
      },
      {
        value: 'sql-chart',
        label: 'View SQL',
        icon: <Code />,
        link: {
          to: '/app/metrics/$metricId/sql',
          params: {
            metricId,
          },
          search: {
            metric_version_number: metricVersionNumber,
          },
        },
      },
    ]);
  }, [metricId, metricVersionNumber]);
};

export const useNavigateToDashboardMetricItem = ({
  metricId,
  metricVersionNumber,
  dashboardId,
  dashboardVersionNumber,
}: {
  metricId: string;
  metricVersionNumber: number | undefined;
  dashboardId: string;
  dashboardVersionNumber: number | undefined;
}): IDropdownItems => {
  return useMemo(() => {
    return createDropdownItems([
      {
        value: 'edit-chart',
        label: 'Edit chart',
        icon: <SquareChartPen />,
        link: {
          to: '/app/dashboards/$dashboardId/metrics/$metricId/chart',
          params: {
            dashboardId,
            metricId,
          },
          search: {
            dashboard_version_number: dashboardVersionNumber,
            metric_version_number: metricVersionNumber,
          },
        },
      },
      {
        value: 'results-chart',
        label: 'Results chart',
        icon: <Table />,
        link: {
          to: '/app/dashboards/$dashboardId/metrics/$metricId/results',
          params: {
            dashboardId,
            metricId,
          },
          search: {
            dashboard_version_number: dashboardVersionNumber,
            metric_version_number: metricVersionNumber,
          },
        },
      },
      {
        value: 'sql-chart',
        label: 'SQL chart',
        icon: <Code />,
        link: {
          to: '/app/dashboards/$dashboardId/metrics/$metricId/sql',
          params: {
            metricId,
            dashboardId,
          },
          search: {
            dashboard_version_number: dashboardVersionNumber,
            metric_version_number: metricVersionNumber,
          },
        },
      },
    ]);
  }, [metricId, metricVersionNumber, dashboardId, dashboardVersionNumber]);
};

export const useEditMetricWithAI = ({
  metricId,
  versionNumber,
}: {
  metricId: string;
  versionNumber: number | undefined;
}) => {
  const { data: shareAssetConfig } = useGetMetric(
    { id: metricId, versionNumber },
    { select: getShareAssetConfig }
  );
  const isEditor = canEdit(shareAssetConfig?.permission);

  const { onCreateFileClick, loading } = useStartChatFromAsset({
    assetId: metricId,
    assetType: 'metric_file',
  });

  return useMemo(
    () =>
      createMenuItem({
        type: 'item',
        label: 'Edit with AI',
        value: 'edit-with-ai',
        icon: <PenSparkle />,
        onClick: onCreateFileClick,
        disabled: !isEditor,
        loading,
      }),
    [metricId, onCreateFileClick, loading, isEditor]
  );
};

export const useMetricShareMenuSelectMenu = ({
  metricId,
  versionNumber,
}: {
  metricId: string;
  versionNumber: number | undefined;
}) => {
  const { data: shareAssetConfig } = useGetMetric(
    { id: metricId, versionNumber },
    { select: getShareAssetConfig }
  );
  const isEffectiveOwner = getIsEffectiveOwner(shareAssetConfig?.permission);

  return useMemo(
    () => ({
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
    }),
    [metricId, shareAssetConfig, isEffectiveOwner]
  );
};

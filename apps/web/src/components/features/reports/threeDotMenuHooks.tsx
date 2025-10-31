import type { ReportResponse } from '@buster/server-shared/reports';
import { useMemo } from 'react';
import { useGetReport } from '@/api/buster_rest/reports';
import type { IDropdownItem } from '@/components/ui/dropdown';
import { PenSparkle, ShareRight } from '@/components/ui/icons';
import { createMenuItem } from '@/components/ui/menu-shared';
import { useStartChatFromAsset } from '@/context/BusterAssets/useStartChatFromAsset';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import { createFavoriteMenuItem, useFavoriteStar } from '../favorites';
import { getShareAssetConfig, ShareMenuContent } from '../ShareMenu';

export const useReportShareMenuSelectMenu = ({ reportId }: { reportId: string }) => {
  const { data: shareAssetConfig } = useGetReport(
    { id: reportId },
    { select: getShareAssetConfig }
  );
  const isEffectiveOwner = getIsEffectiveOwner(shareAssetConfig?.permission);

  return useMemo(
    () =>
      createMenuItem({
        type: 'item',
        label: 'Share',
        value: 'share-report',
        icon: <ShareRight />,
        disabled: !isEffectiveOwner,
        items:
          isEffectiveOwner && shareAssetConfig
            ? [
                <ShareMenuContent
                  key={reportId}
                  shareAssetConfig={shareAssetConfig}
                  assetId={reportId}
                  assetType={'report_file'}
                />,
              ]
            : undefined,
      }),
    [reportId, shareAssetConfig, isEffectiveOwner]
  );
};

export const useEditReportWithAI = ({ reportId }: { reportId: string }) => {
  const { data: shareAssetConfig } = useGetReport(
    { id: reportId },
    { select: getShareAssetConfig }
  );
  const isEditor = canEdit(shareAssetConfig?.permission);

  const { onCreateFileClick, loading } = useStartChatFromAsset({
    assetId: reportId,
    assetType: 'report_file',
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
    [reportId, onCreateFileClick, loading, isEditor]
  );
};

// Favorites for report (toggle add/remove)
const stableReportNameSelector = (state: ReportResponse) => state.name;
export const useFavoriteReportSelectMenu = ({ reportId }: { reportId: string }): IDropdownItem => {
  const { data: name } = useGetReport({ id: reportId }, { select: stableReportNameSelector });
  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id: reportId,
    type: 'report_file',
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

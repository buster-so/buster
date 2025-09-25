import type { GetDashboardResponse } from '@buster/server-shared/dashboards';
import { useNavigate } from '@tanstack/react-router';
import React, { useCallback, useMemo } from 'react';
import type { BusterDashboard, BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import {
  useAddDashboardToCollection,
  useDeleteDashboards,
  useGetDashboard,
  useRemoveDashboardFromCollection,
} from '@/api/buster_rest/dashboards';
import { Star as StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import { useStartChatFromAsset } from '@/context/BusterAssets/useStartChatFromAsset';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { DASHBOARD_TITLE_INPUT_ID } from '@/controllers/DashboardController/DashboardViewDashboardController/DashboardEditTitle';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { onOpenDashboardContentModal } from '../../../context/Dashboards/dashboard-content-store';
import { ensureElementExists } from '../../../lib/element';
import { canEdit, getIsEffectiveOwner } from '../../../lib/share';
import type { IDropdownItem, IDropdownItems } from '../../ui/dropdown';
import { createDropdownItem, DropdownContent } from '../../ui/dropdown';
import {
  ArrowUpRight,
  Filter,
  History,
  PenSparkle,
  Plus,
  ShareRight,
  Star,
  Trash,
} from '../../ui/icons';
import Pencil from '../../ui/icons/NucleoIconOutlined/pencil';
import { useSaveToCollectionsDropdownContent } from '../dropdowns/SaveToCollectionsDropdown';
import { useFavoriteStar } from '../favorites/useFavoriteStar';
import { ASSET_ICONS } from '../icons/assetIcons';
import { getShareAssetConfig, ShareMenuContent } from '../ShareMenu';
import { useListDashboardVersionDropdownItems } from '../versionHistory/useListDashboardVersionDropdownItems';

export const useDashboardVersionHistorySelectMenu = ({
  dashboardId,
  dashboardVersionNumber,
}: {
  dashboardId: string;
  dashboardVersionNumber: number | undefined;
}): IDropdownItem => {
  const { data } = useGetDashboard(
    { id: dashboardId, versionNumber: dashboardVersionNumber },
    {
      select: useCallback(
        (x: GetDashboardResponse) => ({
          versions: x?.versions,
          version_number: x?.dashboard?.version_number,
        }),
        []
      ),
    }
  );
  const { versions = [], version_number } = data || {};

  const versionHistoryItems: IDropdownItems = useListDashboardVersionDropdownItems({
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
        <React.Fragment key="version-history-sub-menu">
          <DropdownContent items={versionHistoryItems} selectType="single-selectable-link" />
        </React.Fragment>,
      ],
    }),
    [versionHistoryItems]
  );
};

export const useCollectionSelectMenu = ({
  dashboardId,
  dashboardVersionNumber,
}: {
  dashboardId: string;
  dashboardVersionNumber: number | undefined;
}) => {
  const { mutateAsync: saveDashboardToCollection } = useAddDashboardToCollection();
  const { mutateAsync: removeDashboardFromCollection } = useRemoveDashboardFromCollection();
  const { data: selectedCollections } = useGetDashboard(
    { id: dashboardId, versionNumber: dashboardVersionNumber },
    {
      select: useCallback(
        (x: BusterDashboardResponse) => x.collections?.map((collection) => collection.id),
        []
      ),
    }
  );
  const { openInfoMessage } = useBusterNotifications();

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    await saveDashboardToCollection({ dashboardIds: [dashboardId], collectionIds });
    openInfoMessage('Dashboard saved to collections');
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    await removeDashboardFromCollection({
      dashboardIds: [dashboardId],
      collectionIds: [collectionId],
    });
    openInfoMessage('Dashboard removed from collections');
  });

  const { ModalComponent, ...dropdownProps } = useSaveToCollectionsDropdownContent({
    onSaveToCollection,
    onRemoveFromCollection,
    selectedCollections: selectedCollections || [],
  });

  const collectionSubMenu = useMemo(() => {
    return <DropdownContent {...dropdownProps} />;
  }, [dropdownProps]);

  const collectionDropdownItem: IDropdownItem = useMemo(
    () =>
      createDropdownItem({
        label: 'Add to collection',
        value: 'add-to-collection',
        icon: <ASSET_ICONS.collectionAdd />,
        items: [
          <React.Fragment key="collection-sub-menu">
            {collectionSubMenu} {ModalComponent}
          </React.Fragment>,
        ],
      }),
    [collectionSubMenu]
  );

  return collectionDropdownItem;
};

export const useFavoriteDashboardSelectMenu = ({
  dashboardId,
  dashboardVersionNumber,
}: {
  dashboardId: string;
  dashboardVersionNumber: number | undefined;
}) => {
  const { data: title } = useGetDashboard(
    { id: dashboardId, versionNumber: dashboardVersionNumber },
    { select: useCallback((x: BusterDashboardResponse) => x?.dashboard?.name, []) }
  );
  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id: dashboardId,
    type: 'dashboard_file',
    name: title || '',
  });

  const item: IDropdownItem = useMemo(
    () =>
      createDropdownItem({
        label: isFavorited ? 'Remove from favorites' : 'Add to favorites',
        value: 'add-to-favorites',
        icon: isFavorited ? <StarFilled /> : <Star />,
        onClick: () => onFavoriteClick(),
        closeOnSelect: false,
      }),
    [isFavorited, onFavoriteClick]
  );

  return item;
};

export const useDeleteDashboardSelectMenu = ({ dashboardId }: { dashboardId: string }) => {
  const { mutateAsync: deleteDashboard } = useDeleteDashboards();
  const navigate = useNavigate();

  return useMemo(
    () =>
      createDropdownItem({
        label: 'Delete dashboard',
        value: 'delete-dashboard',
        icon: <Trash />,
        onClick: async () => {
          await deleteDashboard({ dashboardId });
          navigate({ to: '/app/dashboards' });
        },
      }),
    [dashboardId]
  );
};

export const useRenameDashboardSelectMenu = ({
  dashboardId,
  dashboardVersionNumber,
}: {
  dashboardId: string;
  dashboardVersionNumber: number | undefined;
}) => {
  const navigate = useNavigate();

  return useMemo(
    () =>
      createDropdownItem({
        label: 'Rename dashboard',
        value: 'rename-dashboard',
        icon: <Pencil />,
        onClick: async () => {
          await navigate({
            unsafeRelative: 'path',
            to: '.' as '/app/dashboards/$dashboardId',
            params: (prev) => ({ ...prev, dashboardId }),
            search: dashboardVersionNumber
              ? { dashboard_version_number: dashboardVersionNumber }
              : undefined,
          });
          const input = await ensureElementExists(
            () => document.getElementById(DASHBOARD_TITLE_INPUT_ID(dashboardId)) as HTMLInputElement
          );
          if (input) {
            setTimeout(() => {
              input.focus();
              input.select();
            }, 50);
          }
        },
      }),
    [dashboardId]
  );
};

export const useAddContentToDashboardSelectMenu = () => {
  return useMemo(
    () =>
      createDropdownItem({
        label: 'Add existing charts',
        value: 'add-content',
        icon: <ASSET_ICONS.metircsAdd />,
        onClick: onOpenDashboardContentModal,
      }),
    []
  );
};

export const useFilterDashboardSelectMenu = () => {
  return useMemo(
    () =>
      createDropdownItem({
        label: 'Filter dashboard',
        value: 'filter-dashboard',
        icon: <Filter />,
        items: [
          <div className="p-2.5" key="coming-soon">
            Coming soon 🤙...
          </div>,
        ],
      }),
    []
  );
};

export const useOpenFullScreenDashboard = ({ dashboardId }: { dashboardId: string }) => {
  return useMemo(
    () =>
      createDropdownItem({
        label: 'Open in dashboard page',
        value: 'open-in-full-screen',
        icon: <ArrowUpRight />,
        link: {
          to: '/app/dashboards/$dashboardId',
          params: {
            dashboardId,
          },
        },
      }),
    [dashboardId]
  );
};

export const useShareMenuSelectMenu = ({
  dashboardId,
  dashboardVersionNumber,
}: {
  dashboardId: string;
  dashboardVersionNumber: number | undefined;
}) => {
  const { data: dashboard } = useGetDashboard(
    { id: dashboardId, versionNumber: dashboardVersionNumber },
    { select: getShareAssetConfig }
  );
  const isOwner = getIsEffectiveOwner(dashboard?.permission);

  return useMemo(
    () => ({
      label: 'Share',
      value: 'share-dashboard',
      icon: <ShareRight />,
      disabled: !isOwner,
      items:
        isOwner && dashboard
          ? [
              <ShareMenuContent
                key={dashboardId}
                shareAssetConfig={dashboard}
                assetId={dashboardId}
                assetType={'dashboard_file'}
              />,
            ]
          : undefined,
    }),
    [dashboardId, dashboard, isOwner]
  );
};

export const useEditDashboardWithAI = ({
  dashboardId,
  dashboardVersionNumber,
}: {
  dashboardId: string;
  dashboardVersionNumber: number | undefined;
}) => {
  const { data: dashboard } = useGetDashboard(
    { id: dashboardId, versionNumber: dashboardVersionNumber },
    { select: getShareAssetConfig }
  );
  const isEditor = canEdit(dashboard?.permission);

  const { onCreateFileClick, loading } = useStartChatFromAsset({
    assetId: dashboardId,
    assetType: 'dashboard_file',
  });

  return useMemo(
    () =>
      createDropdownItem({
        label: 'Edit with AI',
        value: 'edit-with-ai',
        icon: <PenSparkle />,
        onClick: onCreateFileClick,
        disabled: !isEditor,
        loading,
      }),
    [dashboardId, onCreateFileClick, loading, isEditor]
  );
};

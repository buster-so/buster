'use client';

import React, { useMemo } from 'react';
import { AppContentHeader } from '../../_components/AppContentHeader';
import { useDashboardContextSelector, useIndividualDashboard } from '@/context/Dashboards';
import { Breadcrumb, Button, Checkbox, Dropdown, MenuProps } from 'antd';
import { BreadcrumbSeperator } from '@/components';
import Link from 'next/link';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { FavoriteStar } from '../../_components/Lists/FavoriteStar';
import { AppMaterialIcons } from '@/components';
import { BusterDashboard, BusterDashboardResponse, BusterShareAssetType } from '@/api/buster-rest';
import { ShareMenu } from '../../_components/ShareMenu';
import { timeout } from '@/utils';
import { AddTypeModal } from '../../_components/AddTypeModal';
import { useCollectionsContextSelector } from '@/context/Collections';
import { useMemoizedFn, useMount } from 'ahooks';
import { useUserConfigContextSelector } from '@/context/Users';

export const DashboardIndividualHeaderPrimary: React.FC<{}> = React.memo(() => {
  const openedDashboardId = useDashboardContextSelector((x) => x.openedDashboardId);
  const setOpenAddContentModal = useDashboardContextSelector((x) => x.setOpenAddContentModal);
  const openAddContentModal = useDashboardContextSelector((x) => x.openAddContentModal);
  const { dashboardResponse } = useIndividualDashboard({ dashboardId: openedDashboardId });

  const dashboard = dashboardResponse?.dashboard;
  const dashboardTitle = dashboard ? dashboard.name || 'New dashboard' : '';

  const onCloseAddTypeModal = useMemoizedFn(() => {
    setOpenAddContentModal(false);
  });

  return (
    <>
      <AppContentHeader>
        <div className="flex w-full justify-between">
          <div className="flex items-center space-x-1">
            <DashboardBreadcrumb dashboard={dashboard} dashboardTitle={dashboardTitle} />
            {dashboard && (
              <div className="flex items-center space-x-0">
                <ThreeDotMenu dashboardResponse={dashboardResponse} />
                <FavoriteStar
                  id={dashboard.id}
                  type={BusterShareAssetType.DASHBOARD}
                  name={dashboardTitle}
                />
              </div>
            )}
          </div>

          {dashboard && <RightContent dashboardResponse={dashboardResponse} />}
        </div>
      </AppContentHeader>

      <AddTypeModal
        open={openAddContentModal}
        onClose={onCloseAddTypeModal}
        type="dashboard"
        dashboardResponse={dashboardResponse}
      />
    </>
  );
});
DashboardIndividualHeaderPrimary.displayName = 'DashboardIndividualHeaderPrimary';

const DashboardBreadcrumb: React.FC<{
  dashboard: BusterDashboard;
  dashboardTitle: string;
}> = React.memo(({ dashboard, dashboardTitle }) => {
  const selectedThreadId = useBusterThreadsContextSelector((x) => x.selectedThreadId);
  const createPageLink = useAppLayoutContextSelector((s) => s.createPageLink);
  const dashboardBaseTitle = selectedThreadId ? dashboard?.name : 'Dashboards';

  const items = useMemo(
    () =>
      [
        {
          title: (
            <Link
              suppressHydrationWarning
              className={`!flex !h-full items-center truncate ${'!cursor-pointer'}`}
              href={createPageLink({ route: BusterRoutes.APP_DASHBOARDS })}>
              {dashboardBaseTitle}
            </Link>
          )
        },
        {
          title: dashboard ? dashboardTitle : undefined
        }
      ].filter((item) => item.title),
    [dashboardTitle, dashboardBaseTitle]
  );

  return <Breadcrumb items={items} separator={<BreadcrumbSeperator />} />;
});
DashboardBreadcrumb.displayName = 'DashboardBreadcrumb';

const RightContent: React.FC<{
  dashboardResponse: BusterDashboardResponse;
}> = React.memo(({ dashboardResponse }) => {
  const setOpenAddContentModal = useDashboardContextSelector((x) => x.setOpenAddContentModal);

  return (
    <div className="flex items-center space-x-1">
      <ShareMenu shareType={BusterShareAssetType.DASHBOARD} dashboardResponse={dashboardResponse}>
        <Button type="text" icon={<AppMaterialIcons icon="share_windows" />} />
      </ShareMenu>
      <Button
        onClick={() => setOpenAddContentModal(true)}
        type="default"
        icon={<AppMaterialIcons icon="add" />}>
        Add content
      </Button>
    </div>
  );
});
RightContent.displayName = 'RightContent';

const ThreeDotMenu: React.FC<{
  dashboardResponse: BusterDashboardResponse;
}> = React.memo(({ dashboardResponse }) => {
  const collectionsList = useCollectionsContextSelector((x) => x.collectionsList);
  const getInitialCollections = useCollectionsContextSelector((x) => x.getInitialCollections);
  const refreshDashboard = useDashboardContextSelector((x) => x.refreshDashboard);
  const onAddToCollection = useDashboardContextSelector((x) => x.onAddToCollection);
  const onRemoveFromCollection = useDashboardContextSelector((x) => x.onRemoveFromCollection);
  const setEditingDashboardTitle = useDashboardContextSelector((x) => x.setEditingDashboardTitle);
  const onDeleteDashboard = useDashboardContextSelector((x) => x.onDeleteDashboard);

  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const addItemToFavorite = useUserConfigContextSelector((state) => state.addItemToFavorite);
  const removeItemFromFavorite = useUserConfigContextSelector(
    (state) => state.removeItemFromFavorite
  );
  const userFavorites = useUserConfigContextSelector((state) => state.userFavorites);

  const dashboard = dashboardResponse?.dashboard!;

  const collections = useMemo(
    () => dashboardResponse?.collections || [],
    [dashboardResponse?.collections]
  );

  const collectionIds = useMemo(
    () => collections.map((collection) => collection.id),
    [collections]
  );

  const isFavorited = useMemo(
    () =>
      userFavorites.some(
        (favorite) => favorite.id === dashboard.id || favorite.collection_id === dashboard.id
      ),
    [userFavorites.length, dashboard.id]
  );

  const threeDotItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'save',
        label: 'Save to collection',
        icon: <AppMaterialIcons icon="note_stack_add" />,
        onClick: () => {},
        disabled: collectionsList.length === 0,
        children: !!collectionsList.length
          ? collectionsList.map((collection) => ({
              key: collection.id,
              label: (
                <div className="flex items-center space-x-2">
                  <Checkbox checked={collectionIds.includes(collection.id)} />
                  <span>{collection.name}</span>
                </div>
              ),
              onClick: async () => {
                const isChecked = collectionIds.includes(collection.id);
                if (!isChecked)
                  onAddToCollection({
                    collectionId: collection.id,
                    dashboardId: dashboard.id
                  });
                else {
                  onRemoveFromCollection({
                    collectionId: collection.id,
                    dashboardId: dashboard.id
                  });
                }
              }
            }))
          : undefined
      },
      {
        key: 'favorite',
        label: isFavorited ? 'Unfavorite dashboard' : 'Favorite dashboard',
        icon: isFavorited ? (
          <AppMaterialIcons icon="star" fill />
        ) : (
          <AppMaterialIcons icon="star" />
        ),
        onClick: async () => {
          const type = BusterShareAssetType.DASHBOARD;

          if (!isFavorited)
            return await addItemToFavorite({
              asset_type: type,
              id: dashboard.id,
              name: dashboard.name
            });
          await removeItemFromFavorite({
            asset_type: type,
            id: dashboard.id
          });
        }
      },
      {
        key: 'rename_dashboard',
        label: 'Rename dashboard',
        icon: <AppMaterialIcons icon="edit" />,
        onClick: () => {
          setEditingDashboardTitle(true);
        }
      },
      {
        type: 'divider'
      },
      {
        key: 'refresh_data',
        label: 'Refresh data',
        icon: <AppMaterialIcons icon="refresh" />,
        onClick: async () => {
          await refreshDashboard(dashboard.id);
        }
      },
      {
        key: 'delete',
        label: 'Delete dashboard',
        icon: <AppMaterialIcons icon="delete" />,
        onClick: async () => {
          try {
            await onDeleteDashboard(dashboard.id);
            await timeout(25);
            onChangePage({ route: BusterRoutes.APP_DASHBOARDS });
          } catch (error) {}
        }
      }
    ],
    [
      collectionsList,
      collectionIds,
      isFavorited,
      dashboard.id,
      dashboard.name,
      onAddToCollection,
      onRemoveFromCollection,
      addItemToFavorite,
      removeItemFromFavorite,
      setEditingDashboardTitle,
      refreshDashboard,
      onDeleteDashboard,
      onChangePage
    ]
  );

  const memoizedThreeDotItems: MenuProps = useMemo(() => {
    return {
      items: threeDotItems
    };
  }, [threeDotItems]);

  useMount(() => {
    getInitialCollections();
  });

  return (
    <Dropdown trigger={['click']} menu={memoizedThreeDotItems}>
      <Button type="text" icon={<AppMaterialIcons icon="more_horiz" />} />
    </Dropdown>
  );
});
ThreeDotMenu.displayName = 'ThreeDotMenu';

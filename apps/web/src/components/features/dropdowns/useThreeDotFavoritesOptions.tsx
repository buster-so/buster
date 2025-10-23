import type { ShareAssetType } from '@buster/server-shared/share';
import { useMemo } from 'react';
import { useGetCollectionsList } from '@/api/buster_rest/collections';
import { useGetDashboardsList } from '@/api/buster_rest/dashboards';
import { useGetMetricsList } from '@/api/buster_rest/metrics';
import {
  useAddUserFavorite,
  useDeleteUserFavorite,
  useGetUserFavorites,
} from '@/api/buster_rest/users';
import { createDropdownItems, type IDropdownItems } from '@/components/ui/dropdown';
import { Star, Xmark } from '@/components/ui/icons';

export const useThreeDotFavoritesOptions = ({
  itemIds,
  assetType,
  onFinish,
}: {
  itemIds: string[];
  assetType: ShareAssetType;
  onFinish: (ids: string[]) => void;
}) => {
  const { mutateAsync: addUserFavorite } = useAddUserFavorite();
  const { mutateAsync: removeUserFavorite } = useDeleteUserFavorite();
  const { data: userFavorites } = useGetUserFavorites();
  const { data: metricList } = useGetMetricsList({}, { enabled: false });
  const { data: dashboardList } = useGetDashboardsList(
    {},
    { enabled: false, staleTime: 60 * 1000 }
  );
  const { data: collectionsListResponse } = useGetCollectionsList(
    {},
    { enabled: false, staleTime: 60 * 1000 }
  );
  const collectionList = collectionsListResponse?.data || [];

  const nameSearchArray = useMemo(() => {
    if (assetType === 'metric_file' && metricList) {
      return metricList?.map((m) => ({
        id: m.id,
        name: m.name,
      }));
    }

    if (assetType === 'dashboard_file' && dashboardList) {
      return dashboardList?.data?.map((d) => ({
        id: d.id,
        name: d.name,
      }));
    }

    if (assetType === 'collection' && collectionList) {
      return collectionList?.map((c) => ({
        id: c.id,
        name: c.name,
      }));
    }

    return [];
  }, [assetType, metricList, dashboardList, collectionList]);

  const dropdownOptions: IDropdownItems = useMemo(
    () =>
      createDropdownItems([
        {
          label: 'Add to favorites',
          icon: <Star />,
          value: 'add-to-favorites',
          onClick: async () => {
            await addUserFavorite([
              ...itemIds.map((id) => ({
                id,
                asset_type: assetType,
                name: nameSearchArray.find((n) => n.id === id)?.name || '',
              })),
            ]);
            onFinish(itemIds);
          },
        },
        {
          label: 'Remove from favorites',
          icon: <Xmark />,
          value: 'remove-from-favorites',
          onClick: async () => {
            await removeUserFavorite(itemIds);
            onFinish(itemIds);
          },
        },
      ]),
    [addUserFavorite, removeUserFavorite, itemIds, assetType, userFavorites]
  );

  return dropdownOptions;
};

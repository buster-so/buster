import React, { useContext, useRef } from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';
import { useMemoizedFn, useMount } from 'ahooks';
import { BusterShareAssetType, BusterUserFavorite } from '@/api/busterv2';

export const useFavoriteProvider = () => {
  const busterSocket = useBusterWebSocket();
  const useMountedUserFavorites = useRef(false);
  const [userFavorites, setUserFavorites] = React.useState<BusterUserFavorite[]>([]);

  const _onSetInitialFavoritesList = useMemoizedFn((favorites: BusterUserFavorite[]) => {
    setUserFavorites(favorites);
  });

  const forceGetFavoritesList = useMemoizedFn(() => {
    useMountedUserFavorites.current = false;
    busterSocket.off({
      route: '/users/favorites/list:listFavorites',
      callback: _onSetInitialFavoritesList
    });
    return _onGetFavoritesList();
  });

  const _onGetFavoritesList = useMemoizedFn(() => {
    if (useMountedUserFavorites.current) return;
    useMountedUserFavorites.current = true;
    busterSocket.emit({
      route: '/users/favorites/list',
      payload: {}
    });
    busterSocket.on({
      route: '/users/favorites/list:listFavorites',
      callback: _onSetInitialFavoritesList
    });
  });

  const addItemToFavorite = useMemoizedFn(
    async ({
      id,
      asset_type,
      name
    }: {
      id: string;
      asset_type: BusterShareAssetType;
      name: string;
      index?: number;
    }) => {
      setUserFavorites((v) => [{ id, type: asset_type, name }, ...v]);

      await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/users/favorites/post',
          payload: {
            id,
            asset_type
          }
        },
        responseEvent: {
          route: '/users/favorites/post:createFavorite',
          callback: _onSetInitialFavoritesList
        }
      });
    }
  );

  const removeItemFromFavorite = useMemoizedFn(
    async ({ id, asset_type }: { id: string; asset_type: BusterShareAssetType }) => {
      setUserFavorites(userFavorites.filter((f) => f.id !== id));
      await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/users/favorites/delete',
          payload: {
            id,
            asset_type
          }
        },
        responseEvent: {
          route: '/users/favorites/post:createFavorite',
          callback: _onSetInitialFavoritesList
        }
      });
    }
  );

  const reorderFavorites = useMemoizedFn(async (favorites: string[]) => {
    requestAnimationFrame(() => {
      setUserFavorites((v) => {
        return favorites.map((id, index) => {
          let favorite = v.find((f) => f.id === id || f.collection_id === id)!;
          return { ...favorite, index };
        });
      });
    });
    await busterSocket.emitAndOnce({
      emitEvent: {
        route: '/users/favorites/update',
        payload: {
          favorites
        }
      },
      responseEvent: {
        route: '/users/favorites/update:updateFavorite',
        callback: _onSetInitialFavoritesList
      }
    });
  });

  const bulkEditFavorites = useMemoizedFn(async (favorites: string[]) => {
    return reorderFavorites(favorites);
  });

  useMount(async () => {
    _onGetFavoritesList();
  });

  return {
    bulkEditFavorites,
    forceGetFavoritesList,
    reorderFavorites,
    userFavorites,
    addItemToFavorite,
    removeItemFromFavorite
  };
};

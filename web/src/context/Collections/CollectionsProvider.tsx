'use client';

import React, { useEffect, useRef } from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import { useParams } from 'next/navigation';
import { BusterCollection, BusterCollectionListItem } from '@/api/buster-rest/collection';
import { CollectionsListEmit, CollectionUpdateCollection } from '@/api/buster-socket/collections';
import { useAppLayoutContextSelector } from '../BusterAppLayout';
import { useBusterNotifications } from '../BusterNotifications';
import {
  useContextSelector,
  createContext,
  ContextSelector
} from '@fluentui/react-context-selector';

export const initialFilterOptionKey = `{}`;

export const useBusterCollections = () => {
  const currentSegment = useAppLayoutContextSelector((s) => s.currentSegment);
  const { openConfirmModal } = useBusterNotifications();
  const [collectionsList, setCollectionsList] = React.useState<BusterCollectionListItem[]>([]);
  const [collectionListFilters, setCollectionFilters] =
    React.useState<Omit<CollectionsListEmit['payload'], 'page' | 'page_size'>>();
  const [openNewCollectionModal, setOpenNewCollectionModal] = React.useState(false);
  const busterSocket = useBusterWebSocket();
  const hasMountedCollectionList = useRef(false);
  const [creatingCollection, setCreatingCollection] = React.useState(false);
  const { collectionId: openedCollectionId } = useParams<{ collectionId: string }>();
  const [openAddTypeModal, setOpenAddTypeModal] = React.useState(false);
  const gettingInitialCollections = useRef<Record<string, boolean>>({});
  const [collectionStatus, setCollectionStatus] = React.useState<
    Record<
      string,
      {
        loading: boolean;
        fetched: boolean;
      }
    >
  >({});

  const _onPostCollectionState = useMemoizedFn((collection: BusterCollection) => {
    setIndividualCollection((prev) => ({
      ...prev,
      [collection.id]: collection
    }));
    return collection;
  });

  const createNewCollection = useMemoizedFn(
    async ({
      name,
      onCollectionCreated
    }: {
      name: string;
      onCollectionCreated?: (id: string) => Promise<void>;
    }) => {
      setCreatingCollection(true);
      const res = await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/collections/post',
          payload: {
            name,
            description: ''
          }
        },
        responseEvent: {
          route: '/collections/post:collectionState',
          callback: _onPostCollectionState
        }
      });
      if (res && onCollectionCreated) await onCollectionCreated?.((res as BusterCollection).id);
      setTimeout(() => {
        setCreatingCollection(false);
      }, 500);
      return res as BusterCollection;
    }
  );

  const { run: updateCollectionDebounced } = useDebounceFn(
    async ({ id, ...props }: CollectionUpdateCollection['payload']) => {
      busterSocket.emit({
        route: '/collections/update',
        payload: {
          id,
          ...props
        }
      });
    },
    { wait: 500 }
  );

  const updateCollection = useMemoizedFn(
    async (props: Omit<CollectionUpdateCollection['payload'], 'assets'>) => {
      setCollectionsList((prev) => {
        return prev.map((collection) => {
          if (collection.id === props.id) {
            return {
              ...collection,
              ...props
            };
          }
          return collection;
        });
      });
      setIndividualCollection((prev) => {
        return {
          ...prev,
          [props.id]: {
            ...(prev[props.id] as BusterCollection),
            name: props.name || (prev[props.id] as BusterCollection).name
          }
        };
      });
      updateCollectionDebounced(props);
    }
  );

  const deleteCollection = useMemoizedFn(
    async (collectionId: string | string[], useConfirmModal = true) => {
      const method = () => {
        busterSocket.emit({
          route: '/collections/delete',
          payload: {
            ids: Array.isArray(collectionId) ? collectionId : [collectionId]
          }
        });
        const arrayOfIds = Array.isArray(collectionId) ? collectionId : [collectionId];
        setCollectionsList((prev) =>
          prev.filter((collection) => !arrayOfIds.includes(collection.id))
        );
      };

      if (useConfirmModal) {
        return await openConfirmModal({
          title: 'Delete Collection',
          content: 'Are you sure you want to delete this collection?',
          onOk: method,
          useReject: true
        });
      }

      return method();
    }
  );

  const getInitialCollections = useMemoizedFn(
    async (filters: Omit<CollectionsListEmit['payload'], 'page' | 'page_size'> = {}) => {
      const filterOptions = { ...filters };
      const filterOptionKey = JSON.stringify(filterOptions);

      if (
        gettingInitialCollections.current[filterOptionKey] ||
        collectionStatus[filterOptionKey]?.loading
      ) {
        return;
      }
      gettingInitialCollections.current[filterOptionKey] = true;

      setCollectionStatus((prev) => ({
        ...prev,
        [filterOptionKey]: {
          fetched: prev[filterOptionKey]?.fetched ?? false,
          loading: true
        }
      }));

      await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/collections/list',
          payload: {
            page: 0,
            page_size: 1000,
            ...filterOptions
          }
        },
        responseEvent: {
          route: '/collections/list:listCollections',
          callback: _onGetInitialCollections
        }
      });

      gettingInitialCollections.current[filterOptionKey] = false;
      setCollectionStatus((prev) => ({
        ...prev,
        [filterOptionKey]: {
          fetched: true,
          loading: false
        }
      }));
    }
  );

  const _onGetInitialCollections = useMemoizedFn(
    async (collections: BusterCollectionListItem[]) => {
      setCollectionsList(collections);
    }
  );

  const unsubscribeToListCollections = useMemoizedFn(() => {
    busterSocket.off({
      route: '/collections/list:listCollections',
      callback: _onGetInitialCollections
    });
    gettingInitialCollections.current = {};
  });

  const onSetCollectionListFilters = useMemoizedFn(
    (newFilters: Omit<CollectionsListEmit['payload'], 'page' | 'page_size'>) => {
      setCollectionFilters(newFilters);
      getInitialCollections(newFilters);
    }
  );

  const getCollectionFromList = useMemoizedFn((collectionId: string) => {
    return collectionsList.find((collection) => collection.id === collectionId);
  });

  useEffect(() => {
    if (!hasMountedCollectionList.current && currentSegment === 'collections') {
      getInitialCollections();
    }
  }, [currentSegment]);

  //INDIVIDUAL COLLECTIONS
  const collectionsSubscribed = useRef<Record<string, boolean>>({});
  const [individualCollection, setIndividualCollection] = React.useState<
    Record<string, BusterCollection>
  >({});

  const _onSetCollectionState = useMemoizedFn((collection: BusterCollection) => {
    setIndividualCollection((prev) => ({
      ...prev,
      [collection.id]: collection
    }));
  });

  const subscribeToCollection = useMemoizedFn(async (collectionId: string) => {
    if (collectionsSubscribed.current[collectionId]) return;
    collectionsSubscribed.current[collectionId] = true;
    busterSocket.emitAndOnce({
      emitEvent: {
        route: '/collections/get',
        payload: {
          id: collectionId
        }
      },
      responseEvent: {
        route: '/collections/get:collectionState',
        callback: _onSetCollectionState
      }
    });
  });

  const unsubscribeToGetCollection = useMemoizedFn(({ collectionId }: { collectionId: string }) => {
    collectionsSubscribed.current[collectionId] = false;
  });

  const onShareCollection = useMemoizedFn(
    async (
      props: Pick<
        CollectionUpdateCollection['payload'],
        | 'id'
        | 'publicly_accessible'
        | 'public_password'
        | 'user_permissions'
        | 'team_permissions'
        | 'public_expiry_date'
        | 'remove_users'
        | 'remove_teams'
      >
    ) => {
      //collectionState
      return await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/collections/update',
          payload: props
        },
        responseEvent: {
          route: '/collections/update:collectionState',
          callback: _onSetCollectionState
        }
      });
    }
  );

  const onBulkAddRemoveToCollection = useMemoizedFn(
    async ({
      assets,
      collectionId
    }: {
      collectionId: string;
      assets: CollectionUpdateCollection['payload']['assets'];
    }) => {
      await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/collections/update',
          payload: {
            id: collectionId,
            assets
          }
        },
        responseEvent: {
          route: '/collections/update:collectionState',
          callback: _onSetCollectionState
        }
      });
    }
  );

  return {
    unsubscribeToGetCollection,
    onBulkAddRemoveToCollection,
    collectionStatus,
    individualCollection,
    subscribeToCollection,
    setIndividualCollection,
    collectionsList,
    createNewCollection,
    updateCollection,
    deleteCollection,
    getInitialCollections,
    unsubscribeToListCollections,
    onSetCollectionListFilters,
    collectionListFilters,
    openedCollectionId,
    openNewCollectionModal,
    setOpenNewCollectionModal,
    creatingCollection,
    onShareCollection,
    openAddTypeModal,
    setOpenAddTypeModal,
    getCollectionFromList
  };
};

const BusterCollections = createContext<ReturnType<typeof useBusterCollections>>(
  {} as ReturnType<typeof useBusterCollections>
);

export const BusterCollectionsProvider = React.memo<{
  children: React.ReactNode;
}>(({ children }) => {
  const value = useBusterCollections();

  return <BusterCollections.Provider value={value}>{children}</BusterCollections.Provider>;
});
BusterCollectionsProvider.displayName = 'BusterCollectionsProvider';

export const useCollectionsContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterCollections>, T>
) => useContextSelector(BusterCollections, selector);

export const useIndividualCollection = ({
  collectionId,
  ignoreSubscribe
}: {
  collectionId: string | undefined;
  ignoreSubscribe?: boolean;
}) => {
  const collection = useCollectionsContextSelector(
    (state) => state.individualCollection[collectionId || '']
  );
  const subscribeToCollection = useCollectionsContextSelector(
    (state) => state.subscribeToCollection
  );
  const unsubscribeToGetCollection = useCollectionsContextSelector(
    (state) => state.unsubscribeToGetCollection
  );

  useEffect(() => {
    if (collectionId && !ignoreSubscribe) {
      subscribeToCollection(collectionId);
      return () => {
        unsubscribeToGetCollection({ collectionId });
      };
    }
  }, [collectionId]);

  return {
    collection
  };
};

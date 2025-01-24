'use client';

import React, { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterThreadListItem, BusterVerificationStatus } from '@/api/buster_rest';
import isEmpty from 'lodash/isEmpty';
import { useBusterWebSocket } from '../BusterWebSocket';
import { useParams } from 'next/navigation';
import { BusterRoutes } from '@/routes';
import { useMemoizedFn, useThrottleFn } from 'ahooks';
import { threadsArrayToRecord } from './helpers';
import { defaultBusterThreadListItem } from './config';
import { useBusterThreadsContextSelector } from './BusterThreadsProvider';
import {
  createContext,
  useContextSelector,
  ContextSelector
} from '@fluentui/react-context-selector';

const useThreadsList = () => {
  const { threadId: openedThreadId } = useParams<{ threadId: string }>();
  const busterSocket = useBusterWebSocket();
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const getThread = useBusterThreadsContextSelector((x) => x.getThreadNotLiveDataMethodOnly);
  const onUpdateThread = useBusterThreadsContextSelector((x) => x.onUpdateThread);

  const [threadsList, setThreadsList] = useState<Record<string, BusterThreadListItem>>({});
  const [threadListIds, setThreadListIds] = useState<Record<string, string[]>>({});
  const loadedThreadList = useRef<
    Record<
      string,
      {
        loading: boolean;
        fetched: boolean;
        fetchedAt: number;
      }
    >
  >({});

  const _onInitializeThreads = useMemoizedFn(
    (threads: BusterThreadListItem[], filters: BusterVerificationStatus[], admin_view: boolean) => {
      const newThreads = threadsArrayToRecord(threads);
      setThreadsList((prev) => ({
        ...prev,
        ...newThreads
      }));
      setThreadListIds((prev) => ({
        ...prev,
        [createFilterRecord({ filters, admin_view })]: Object.keys(newThreads)
      }));

      loadedThreadList.current = {
        ...loadedThreadList.current,
        [createFilterRecord({ filters, admin_view })]: {
          loading: false,
          fetched: true,
          fetchedAt: Date.now()
        }
      };
    }
  );

  const onUpdateThreadListItem = useMemoizedFn((newThread: BusterThreadListItem) => {
    setThreadsList((prevThreads) => {
      const existingThread = prevThreads[newThread.id];
      return {
        ...prevThreads,
        [newThread.id]: {
          ...defaultBusterThreadListItem,
          ...existingThread,
          ...newThread
        }
      };
    });
  });

  const removeItemFromThreadsList = useMemoizedFn(({ threadId }: { threadId: string }) => {
    setThreadsList((prevThreads) => {
      const newThreads = { ...prevThreads };
      delete newThreads[threadId];
      return newThreads;
    });
    setThreadListIds((prevThreadListIds) => {
      const newThreadListIds = { ...prevThreadListIds };
      Object.keys(newThreadListIds).forEach((key) => {
        newThreadListIds[key] = newThreadListIds[key].filter((id) => id !== threadId);
      });
      return newThreadListIds;
    });
  });

  const onOpenThread = useMemoizedFn((threadId: string) => {
    const thread = getThread({ threadId });
    if (!thread) {
      const threadListItem = threadsList[threadId]!;
      onUpdateThread({
        id: threadId,
        title: threadListItem.title
      });
    }
    onChangePage({
      route: BusterRoutes.APP_THREAD_ID,
      threadId
    });
  });

  const _getThreadsList = useMemoizedFn(
    ({ filters, admin_view }: { admin_view: boolean; filters?: BusterVerificationStatus[] }) => {
      const recordKey = createFilterRecord({ filters, admin_view });

      if (loadedThreadList.current[recordKey]?.loading) {
        return;
      }

      loadedThreadList.current = {
        ...loadedThreadList.current,
        [recordKey]: {
          loading: true,
          fetched: loadedThreadList.current[recordKey]?.fetched || false,
          fetchedAt: loadedThreadList.current[recordKey]?.fetchedAt || Date.now()
        }
      };

      const selectedFilters = isEmpty(filters) ? { status: null } : { status: filters! };

      return busterSocket.emitAndOnce({
        emitEvent: {
          route: '/threads/list',
          payload: {
            page_token: 0,
            page_size: 1000,
            admin_view,
            filters: selectedFilters
          }
        },
        responseEvent: {
          route: '/threads/list:getThreadsList',
          callback: (v) => _onInitializeThreads(v, filters || [], admin_view)
        }
      });
    }
  );

  const { run: getThreadsList } = useThrottleFn(_getThreadsList, { wait: 350, leading: true });

  return {
    threadListIds,
    threadsList,
    getThreadsList,
    removeItemFromThreadsList,
    openedThreadId,
    onOpenThread,
    onUpdateThreadListItem,
    loadedThreadList
  };
};

const BusterThreadsList = createContext<ReturnType<typeof useThreadsList>>(
  {} as ReturnType<typeof useThreadsList>
);

export const BusterThreadsListProvider: React.FC<PropsWithChildren> = React.memo(({ children }) => {
  const threadsContext = useThreadsList();

  return <BusterThreadsList.Provider value={threadsContext}>{children}</BusterThreadsList.Provider>;
});
BusterThreadsListProvider.displayName = 'BusterThreadsListProvider';

export const useBusterThreadsListContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useThreadsList>, T>
) => {
  return useContextSelector(BusterThreadsList, selector);
};

export const useBusterThreadListByFilter = (params: {
  filters: BusterVerificationStatus[];
  admin_view: boolean;
}) => {
  const filterRecord = useMemo(() => createFilterRecord(params), [params]);
  const threadListIds = useBusterThreadsListContextSelector((x) => x.threadListIds);
  const threadsList = useBusterThreadsListContextSelector((x) => x.threadsList);
  const allThreadListLoadingStatus = useBusterThreadsListContextSelector(
    (x) => x.loadedThreadList.current
  );
  const threadListLoadingStatus = allThreadListLoadingStatus[filterRecord];
  const getThreadsList = useBusterThreadsListContextSelector((x) => x.getThreadsList);

  const list = useMemo(() => {
    const listIds = threadListIds[createFilterRecord(params)] || [];
    return listIds.map((id) => threadsList[id]);
  }, [threadListIds, threadsList, filterRecord]);

  useEffect(() => {
    const wasFetchedMoreThanXSecondsAgo = Date.now() - threadListLoadingStatus?.fetchedAt > 2000;
    if (
      (!threadListLoadingStatus?.fetched || wasFetchedMoreThanXSecondsAgo) &&
      !threadListLoadingStatus?.loading
    ) {
      getThreadsList(params);
    }
  }, [getThreadsList, filterRecord]);

  return { list, threadListLoadingStatus };
};

const createFilterRecord = ({
  filters = [],
  admin_view
}: {
  filters?: BusterVerificationStatus[];
  admin_view: boolean;
}): string => {
  const filtersString = filters.join(',');
  const adminViewString = admin_view ? 'admin_view' : '';
  return filtersString + adminViewString;
};

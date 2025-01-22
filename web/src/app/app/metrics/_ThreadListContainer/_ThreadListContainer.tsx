'use client';

import React, { useState } from 'react';
import { AppContent } from '../../_components/AppContent';
import { useBusterThreadListByFilter } from '@/context/Threads/BusterThreadsListProvider';
import { ThreadItemsContainer } from './_ThreadItemsContainer';
import { ThreadSidebarHeader } from './_ThreadSidebarHeader';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn, useMount } from 'ahooks';
import { BusterVerificationStatus } from '@/api/buster_rest';

export const ThreadListContainer: React.FC<{
  className?: string;
  type: 'logs' | 'threads';
}> = ({ type, className = '' }) => {
  const onToggleThreadsModal = useAppLayoutContextSelector((s) => s.onToggleThreadsModal);
  const [filters, setFilters] = useState<BusterVerificationStatus[]>([]);
  const adminView = type === 'logs';
  const { list, threadListLoadingStatus } = useBusterThreadListByFilter({
    filters,
    admin_view: adminView
  });

  const onSetFilters = useMemoizedFn((newFilters: BusterVerificationStatus[]) => {
    setFilters(newFilters);
  });

  const onOpenNewCollectionModal = useMemoizedFn(() => {
    onToggleThreadsModal();
  });

  useMount(async () => {
    onSetFilters([]);
  });

  return (
    <div className={`${className} flex h-full flex-col`}>
      <ThreadSidebarHeader type={type} filters={filters} onSetFilters={onSetFilters} />
      <AppContent className="">
        <ThreadItemsContainer
          type={type}
          threads={list}
          openNewCollectionModal={onOpenNewCollectionModal}
          loading={!threadListLoadingStatus?.fetched}
          className="flex-col overflow-hidden"
        />
      </AppContent>
    </div>
  );
};

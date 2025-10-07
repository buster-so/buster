import React, { useState } from 'react';
import { useSearchInfinite } from '@/api/buster_rest/search';
import type { SearchItem } from '@/components/ui/search/SearchModal/search-modal.types';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { GlobalSearchModalBase } from './GlobalSearchModalBase';

export const GlobalSearchModal = () => {
  const { searchQuery, setSearchQuery, allResults, isLoading, scrollContainerRef } =
    useSearchInfinite({
      page_size: 15,
      scrollConfig: {
        scrollThreshold: 60,
      },
    });

  const hasQuery = searchQuery.length > 0;

  const onSelect = useMemoizedFn((v: SearchItem) => {
    console.log('v', v);
    //   setSearchQuery(v.value);
  });

  return (
    <GlobalSearchModalBase
      value={searchQuery}
      items={allResults}
      onChangeValue={setSearchQuery}
      onSelect={onSelect}
      loading={isLoading}
      scrollContainerRef={scrollContainerRef}
      openSecondaryContent={hasQuery}
    />
  );
};

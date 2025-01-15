'use client';

import React, { useContext, useMemo } from 'react';
import { AppContentHeader } from '../../_components/AppContentHeader';
import { Button, Input } from 'antd';
import { AppMaterialIcons, AppPopoverMenu, AppSegmented, AppTooltip } from '@/components';
import { AppTooltipShortcutPill } from '@/components/tooltip/AppTooltipShortcutPill';
import { useHotkeys } from 'react-hotkeys-hook';
import type { InputRef } from 'antd';
import { BusterVerificationStatus } from '@/api/buster-rest';
import { Text } from '@/components';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from 'ahooks';
import { SegmentedValue } from 'antd/lib/segmented';

export const ThreadSidebarHeader: React.FC<{
  type: 'logs' | 'threads';
  filters: BusterVerificationStatus[];
  onSetFilters: (filters: BusterVerificationStatus[]) => void;
}> = ({ type, filters, onSetFilters }) => {
  const title = type === 'logs' ? 'Logs' : 'Metrics';
  const onToggleThreadsModal = useAppLayoutContextSelector((s) => s.onToggleThreadsModal);
  const showFilters: boolean = true;

  const onToggleThreadsModalPreflight = useMemoizedFn(() => {
    onToggleThreadsModal();
  });

  return (
    <AppContentHeader>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center space-x-2">
          <Text>{title}</Text>
          {showFilters && (
            <ThreadsFilters type={type} filters={filters} onSetFilters={onSetFilters} />
          )}
        </div>
        <div className="flex items-center">
          <Button
            icon={<AppMaterialIcons icon="edit_square" />}
            type="default"
            onClick={onToggleThreadsModalPreflight}>
            New metric
          </Button>
        </div>
      </div>
    </AppContentHeader>
  );
};

const options = [
  {
    label: 'All',
    value: 'all'
  },
  {
    label: 'Requested',
    value: BusterVerificationStatus.requested
  },
  {
    label: 'Verified',
    value: BusterVerificationStatus.verified
  }
];

const ThreadsFilters: React.FC<{
  type: 'logs' | 'threads';
  filters: BusterVerificationStatus[];
  onSetFilters: (filters: BusterVerificationStatus[]) => void;
}> = React.memo(({ type, filters, onSetFilters }) => {
  const selectedOption = useMemo(() => {
    return (
      options.find((option) => {
        return filters.includes(option.value as BusterVerificationStatus);
      }) || options[0]
    );
  }, [filters]);

  const onChange = useMemoizedFn((v: SegmentedValue) => {
    if (v === 'all') {
      onSetFilters([]);
    } else {
      onSetFilters([v as BusterVerificationStatus]);
    }
  });

  return <AppSegmented value={selectedOption?.value} options={options} onChange={onChange} />;
});
ThreadsFilters.displayName = 'ThreadsFilters';

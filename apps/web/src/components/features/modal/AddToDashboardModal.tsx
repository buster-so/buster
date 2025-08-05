import React, { useLayoutEffect, useMemo, useState } from 'react';
import { useAddAndRemoveMetricsFromDashboard, useGetDashboard } from '@/api/buster_rest/dashboards';
import { useSearch } from '@/api/buster_rest/search';
import { Button } from '@/components/ui/buttons';
import type { BusterListRowItem } from '@/components/ui/list';
import {
  InputSelectModal,
  type InputSelectModalProps
} from '@/components/ui/modal/InputSelectModal';
import { useDebounce, useMemoizedFn } from '@/hooks';
import { formatDate } from '@/lib';
import type { BusterSearchResult } from '@/api/asset_interfaces/search';

export const AddToDashboardModal: React.FC<{
  open: boolean;
  onClose: () => void;
  dashboardId: string;
}> = React.memo(({ open, onClose, dashboardId }) => {
  const { data: dashboard, isFetched: isFetchedDashboard } = useGetDashboard({ id: dashboardId });
  const { mutateAsync: addAndRemoveMetricsFromDashboard } = useAddAndRemoveMetricsFromDashboard();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<{ id: string; name: string }[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, { wait: 175 });

  const selectedMetricsIds = useMemo(() => {
    return selectedMetrics.map((metric) => metric.id);
  }, [selectedMetrics]);

  const { data: searchResults } = useSearch(
    {
      query: debouncedSearchTerm,
      asset_types: ['metric'],
      num_results: 100
    },
    { enabled: true }
  );

  const columns = useMemo<InputSelectModalProps<BusterSearchResult>['columns']>(
    () => [
      {
        title: 'Name',
        dataIndex: 'name'
      },
      {
        title: 'Updated',
        dataIndex: 'updated_at',
        width: 140,
        render: (value) => {
          return formatDate({
            date: value,
            format: 'lll'
          });
        }
      }
    ],
    []
  );

  const rows = useMemo(() => {
    return (
      searchResults?.map((result) => ({
        id: result.id,
        dataTestId: `item-${result.id}`,
        data: result
      })) || []
    );
  }, [searchResults]);

  const handleAddAndRemoveMetrics = useMemoizedFn(async () => {
    await addAndRemoveMetricsFromDashboard({
      dashboardId: dashboardId,
      metrics: selectedMetrics
    });
    onClose();
  });

  const onSelectChange = useMemoizedFn((items: string[]) => {
    const itemsWithName = items.map((id) => {
      const item = rows.find((row) => row.id === id);
      return {
        id: id,
        name: item?.data?.name || id
      };
    });

    setSelectedMetrics(itemsWithName);
  });

  const isSelectedChanged = useMemo(() => {
    const originalIds = Object.keys(dashboard?.metrics || {});
    const newIds = selectedMetricsIds;
    return originalIds.length !== newIds.length || originalIds.some((id) => !newIds.includes(id));
  }, [dashboard?.metrics, selectedMetricsIds]);

  const emptyState = useMemo(() => {
    if (!isFetchedDashboard) {
      return 'Loading metrics...';
    }
    if (rows.length === 0) {
      return 'No metrics found';
    }
    return undefined;
  }, [isFetchedDashboard, rows]);

  const addedMetricCount = useMemo(() => {
    return selectedMetricsIds.filter((id) => !Object.keys(dashboard?.metrics || {}).includes(id))
      .length;
  }, [dashboard?.metrics, selectedMetricsIds]);

  const removedMetricCount = useMemo(() => {
    return Object.keys(dashboard?.metrics || {}).filter((id) => !selectedMetricsIds.includes(id))
      .length;
  }, [dashboard?.metrics, selectedMetricsIds]);

  const primaryButtonText = useMemo(() => {
    if (!isFetchedDashboard) {
      return 'Loading metrics...';
    }

    const hasRemovedItems = removedMetricCount > 0;
    const hasAddedItems = addedMetricCount > 0;

    if (hasRemovedItems && hasAddedItems) {
      return 'Update dashboard';
    }

    if (hasRemovedItems) {
      return 'Remove metrics';
    }

    if (hasAddedItems) {
      return 'Add metrics';
    }

    return 'Update dashboard';
  }, [isFetchedDashboard, removedMetricCount, addedMetricCount]);

  const primaryButtonTooltipText = useMemo(() => {
    if (!isFetchedDashboard) {
      return '';
    }

    const hasRemovedItems = removedMetricCount > 0;
    const hasAddedItems = addedMetricCount > 0;
    const returnText: string[] = [];

    if (!hasRemovedItems && !hasAddedItems) {
      return 'No changes to update';
    }

    if (hasRemovedItems) {
      returnText.push(`Removing ${removedMetricCount}`);
    }

    if (hasAddedItems) {
      returnText.push(`Adding ${addedMetricCount}`);
    }

    return returnText.join(', ');
  }, [isFetchedDashboard, addedMetricCount, removedMetricCount]);

  const footer: NonNullable<InputSelectModalProps['footer']> = useMemo(() => {
    return {
      left:
        selectedMetrics.length > 0 ? (
          <Button variant="ghost" onClick={() => setSelectedMetrics([])}>
            Clear selected
          </Button>
        ) : undefined,
      secondaryButton: {
        text: 'Cancel',
        onClick: onClose
      },
      primaryButton: {
        text: primaryButtonText,
        onClick: handleAddAndRemoveMetrics,
        disabled: !isSelectedChanged,
        tooltip: primaryButtonTooltipText
      }
    };
  }, [
    selectedMetrics.length,
    primaryButtonTooltipText,
    primaryButtonText,
    isSelectedChanged,
    handleAddAndRemoveMetrics
  ]);

  useLayoutEffect(() => {
    if (isFetchedDashboard) {
      const metrics = Object.values(dashboard?.metrics || {}).map((metric) => ({
        id: metric.id,
        name: metric.name
      }));
      setSelectedMetrics(metrics);
    }
  }, [isFetchedDashboard, dashboard?.metrics]);

  return (
    <InputSelectModal
      width={675}
      open={open}
      onClose={onClose}
      columns={columns}
      rows={rows}
      onSelectChange={onSelectChange}
      selectedRowKeys={selectedMetricsIds}
      footer={footer}
      emptyState={emptyState}
      searchText={searchTerm}
      handleSearchChange={setSearchTerm}
    />
  );
});

AddToDashboardModal.displayName = 'AddToDashboardModal';

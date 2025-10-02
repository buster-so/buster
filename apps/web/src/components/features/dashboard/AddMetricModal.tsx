import type { SearchTextRequest, SearchTextResponse } from '@buster/server-shared/search';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearch } from '@/api/buster_rest/search';
import { Button } from '@/components/ui/buttons';
import {
  InputSelectModal,
  type InputSelectModalProps,
} from '@/components/ui/modal/InputSelectModal';
import { useDebounce } from '@/hooks/useDebounce';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { formatDate } from '@/lib/date';
import { assetTypeToIcon } from '../icons/assetIcons';

export const AddMetricModal: React.FC<{
  open: boolean;
  initialSelectedMetrics: { id: string; name: string }[];
  loading: boolean;
  selectionMode?: 'single' | 'multiple';
  saveButtonText: string;
  onClose: () => void;
  onAddMetrics: (metrics: { id: string; name: string }[]) => Promise<void>;
}> = React.memo(
  ({
    open,
    saveButtonText,
    selectionMode = 'multiple',
    initialSelectedMetrics,
    loading,
    onAddMetrics,
    onClose,
  }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMetrics, setSelectedMetrics] = useState<{ id: string; name: string }[]>([]);
    const debouncedSearchTerm = useDebounce(searchTerm, { wait: 125 });

    // IDs for initial selection provided via props
    const initialSelectedMetricIds = useMemo(
      () => initialSelectedMetrics.map((metric) => metric.id),
      [initialSelectedMetrics]
    );
    // IDs for current internal selection state
    const currentSelectedMetricIds = useMemo(
      () => selectedMetrics.map((metric) => metric.id),
      [selectedMetrics]
    );

    const { data: searchResults } = useSearch(
      {
        query: debouncedSearchTerm,
        assetTypes: ['metric_file'],
        page_size: 25,
        page: 1,
      } satisfies SearchTextRequest,
      { enabled: true, select: useCallback((data: SearchTextResponse) => data.data, []) }
    );

    const columns = useMemo<InputSelectModalProps<SearchTextResponse['data'][number]>['columns']>(
      () => [
        {
          title: 'Title',
          dataIndex: 'title',
          render: (value, record) => {
            const Icon = assetTypeToIcon(record.assetType);
            return (
              <div className="flex items-center gap-1.5 search-bold">
                <span className="text-icon-color">
                  <Icon />
                </span>
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: this endpoint is sanitized */}
                <span dangerouslySetInnerHTML={{ __html: value }}></span>
              </div>
            );
          },
        },
        {
          title: 'Updated at',
          dataIndex: 'updatedAt',
          width: 140,
          render: (value) => {
            return formatDate({
              date: value,
              format: 'lll',
            });
          },
        },
      ],
      []
    );

    const rows = useMemo(() => {
      return (
        searchResults?.map((result) => ({
          id: result.assetId,
          dataTestId: `item-${result.assetId}`,
          data: result,
        })) || []
      );
    }, [searchResults]);

    const handleAddAndRemoveMetrics = useMemoizedFn(async () => {
      await onAddMetrics(selectedMetrics);
      onClose();
    });

    const onSelectChange = useMemoizedFn((items: string[]) => {
      // Handle single selection mode - only allow one item to be selected
      let finalItems = items;
      if (selectionMode === 'single' && items.length > 1) {
        // Take only the last selected item (the most recent selection)
        finalItems = [items[items.length - 1]];
      }

      const itemsWithName = finalItems.map((id) => {
        const item = rows.find((row) => row.id === id);
        return {
          id: id,
          name: item?.data?.title || id,
        };
      });

      setSelectedMetrics(itemsWithName);
    });

    const isSelectedChanged = useMemo(() => {
      // Compare internal selection against the initial selection
      if (initialSelectedMetricIds.length !== currentSelectedMetricIds.length) return true;
      const initialSet = new Set(initialSelectedMetricIds);
      for (const id of currentSelectedMetricIds) {
        if (!initialSet.has(id)) return true;
      }
      return false;
    }, [initialSelectedMetricIds, currentSelectedMetricIds]);

    const emptyState = useMemo(() => {
      if (loading) {
        return 'Loading metrics...';
      }
      if (rows.length === 0) {
        return 'No metrics found';
      }
      return undefined;
    }, [loading, rows]);

    const addedMetricCount = useMemo(() => {
      // Count metrics newly selected compared to the initial selection
      const initialSet = new Set(initialSelectedMetricIds);
      return currentSelectedMetricIds.filter((id) => !initialSet.has(id)).length;
    }, [initialSelectedMetricIds, currentSelectedMetricIds]);

    const removedMetricCount = useMemo(() => {
      // Count metrics removed from the initial selection
      const currentSet = new Set(currentSelectedMetricIds);
      return initialSelectedMetricIds.filter((id) => !currentSet.has(id)).length;
    }, [initialSelectedMetricIds, currentSelectedMetricIds]);

    const primaryButtonText = useMemo(() => {
      if (loading) {
        return 'Loading metrics...';
      }

      const hasRemovedItems = removedMetricCount > 0;
      const hasAddedItems = addedMetricCount > 0;

      if (hasRemovedItems && hasAddedItems) {
        return saveButtonText;
      }

      if (hasRemovedItems) {
        return selectionMode === 'single' ? 'Remove metric' : 'Remove metrics';
      }

      if (hasAddedItems) {
        return selectionMode === 'single' ? 'Add metric' : 'Add metrics';
      }

      return saveButtonText;
    }, [loading, removedMetricCount, addedMetricCount, selectionMode, saveButtonText]);

    const primaryButtonTooltipText = useMemo(() => {
      if (loading) {
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
    }, [loading, addedMetricCount, removedMetricCount]);

    const footer: NonNullable<InputSelectModalProps['footer']> = useMemo(() => {
      return {
        left:
          selectedMetrics.length > 0 ? (
            <Button variant="ghost" onClick={() => setSelectedMetrics([])}>
              {selectionMode === 'single' ? 'Clear selection' : 'Clear selected'}
            </Button>
          ) : undefined,
        secondaryButton: {
          text: 'Cancel',
          onClick: onClose,
        },
        primaryButton: {
          text: primaryButtonText,
          onClick: handleAddAndRemoveMetrics,
          disabled: !isSelectedChanged,
          tooltip: primaryButtonTooltipText,
        },
      };
    }, [
      selectedMetrics.length,
      primaryButtonTooltipText,
      primaryButtonText,
      isSelectedChanged,
      handleAddAndRemoveMetrics,
      selectionMode,
      onClose,
    ]);

    // Initialize internal selection from props only when the modal opens
    useEffect(() => {
      if (open) {
        setSelectedMetrics(initialSelectedMetrics);
      }
    }, [open]);

    return (
      <InputSelectModal
        width={675}
        open={open}
        onClose={onClose}
        columns={columns}
        rows={rows}
        onSelectChange={onSelectChange}
        selectedRowKeys={currentSelectedMetricIds}
        footer={footer}
        emptyState={emptyState}
        searchText={searchTerm}
        handleSearchChange={setSearchTerm}
        showSelectAll={selectionMode === 'multiple'}
      />
    );
  }
);

AddMetricModal.displayName = 'AddMetricModal';

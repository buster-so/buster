import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Modal, Button, Divider, Input, InputRef } from 'antd';
import { AppMaterialIcons, AppSegmented, Text } from '@/components';
import { BusterList, BusterListColumn, BusterListRow } from '@/components/list';
import { useMemoizedFn, useThrottleFn } from 'ahooks';
import { boldHighlights, formatDate } from '@/utils';
import {
  BusterDashboardResponse,
  BusterSearchResult,
  BusterShareAssetType
} from '@/api/buster_rest';
import { asset_typeToIcon } from '@/app/_helpers';
import { CircleSpinnerLoaderContainer } from '@/components/loaders';
import { BusterCollection } from '@/api/buster_rest/collection';
import { useBusterSearchContextSelector } from '@/context/Search';
import isEmpty from 'lodash/isEmpty';
import { useDashboardContextSelector } from '@/context/Dashboards';
import { useCollectionsContextSelector } from '@/context/Collections';
import { SegmentedValue } from 'antd/es/segmented';
import { BusterSearchRequest } from '@/api/buster_socket/search';
import { busterAppStyleConfig } from '@/styles/busterAntDStyleConfig';

const token = busterAppStyleConfig.token!;

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Metrics', value: 'metrics' },
  { label: 'Dashboards', value: 'dashboards' }
];

export const AddTypeModal: React.FC<{
  open: boolean;
  onClose: () => void;
  type?: 'collection' | 'dashboard';
  dashboardResponse?: BusterDashboardResponse;
  collection?: BusterCollection;
}> = React.memo(({ type = 'collection', open, onClose, collection, dashboardResponse }) => {
  const onBusterSearch = useBusterSearchContextSelector((state) => state.onBusterSearch);
  const refreshDashboard = useDashboardContextSelector((state) => state.refreshDashboard);
  const onBulkAddRemoveToDashboard = useDashboardContextSelector(
    (state) => state.onBulkAddRemoveToDashboard
  );
  const onBulkAddRemoveToCollection = useCollectionsContextSelector(
    (state) => state.onBulkAddRemoveToCollection
  );
  const [selectedFilter, setSelectedFilter] = React.useState<string>(filterOptions[0]!.value);
  const [inputValue, setInputValue] = React.useState<string>('');
  const [ongoingSearchItems, setOngoingSearchItems] = React.useState<BusterSearchResult[]>([]);
  const [initialSearchItems, setInitialSearchItems] = React.useState<BusterSearchResult[]>([]);
  const [loadedInitialSearchItems, setLoadedInitialSearchItems] = React.useState(false);
  const [selectedItemIds, setSelectedItemIds] = React.useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const inputRef = useRef<InputRef>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const allSeenItems = useRef<Record<string, BusterSearchResult>>({});

  const mountedInitial = useRef(false);

  const dashboard = dashboardResponse?.dashboard;

  const searchItems = inputValue ? ongoingSearchItems : ongoingSearchItems;

  const columns: BusterListColumn[] = useMemo(() => {
    const fallbackName = (name: string, type: BusterShareAssetType) => {
      if (type === BusterShareAssetType.DASHBOARD && !name) {
        return 'New dashboard';
      }
      if (type === BusterShareAssetType.THREAD && !name) {
        return 'New metric';
      }

      return name;
    };

    return [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (_, record: BusterSearchResult) => {
          const { name, updated_at, type, highlights } = record;
          const icon = asset_typeToIcon(type, {
            size: 17
          });
          const boldedText = boldHighlights(fallbackName(name, type), highlights);

          return (
            <div className="flex items-center space-x-2">
              <div className="flex items-center">{icon}</div>
              <Text>{boldedText}</Text>
            </div>
          );
        }
      },
      {
        title: 'Updated at',
        dataIndex: 'updated_at',
        width: 125,
        render: (data) => formatDate({ date: data, format: 'lll' })
      }
    ];
  }, []);

  const rows: BusterListRow[] = useMemo(() => {
    return searchItems.map((item) => ({
      id: item.id,
      data: item,
      onClick: () => {
        setSelectedItemIds((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
      }
    }));
  }, [searchItems]);

  const selectedItemIdsKeys = useMemo(() => {
    return Object.entries(selectedItemIds)
      .filter(([, value]) => value)
      .map(([key]) => key);
  }, [selectedItemIds]);

  const onSelectChange = useMemoizedFn((selectedRowKeys: string[]) => {
    const updatedSelectedItemIds = selectedRowKeys.reduce<Record<string, boolean>>((acc, curr) => {
      acc[curr] = true;
      return acc;
    }, {});
    setSelectedItemIds({ ...updatedSelectedItemIds });
  });

  const addToAllSeenItems = useMemoizedFn((results: BusterSearchResult[]) => {
    results.forEach((item) => {
      allSeenItems.current[item.id] = item;
    });
  });

  const onSetSelectedFilter = useMemoizedFn(async (value: string) => {
    setSelectedFilter(value);
    let results: BusterSearchResult[] = [];
    if (value === 'metrics') {
      results = await onSearchInput.run(inputValue, 'useMetrics');
    } else if (value === 'dashboards') {
      results = await onSearchInput.run(inputValue, 'useDashboards');
    } else {
      results = await onSearchInput.run(inputValue);
    }
    setInitialSearchItems(results);
    setLoadedInitialSearchItems(true);
    addToAllSeenItems(results);
  });

  const onSearchInput = useThrottleFn(
    async (query: string, params?: 'useMetrics' | 'useDashboards') => {
      let results: BusterSearchResult[] = [];
      let include: (keyof BusterSearchRequest['payload'])[] = [];

      if (type === 'collection') {
        include = ['exclude_dashboards', 'exclude_threads'];
        if (params === 'useMetrics') {
          include = ['exclude_threads'];
        } else if (params === 'useDashboards') {
          include = ['exclude_dashboards'];
        }

        results = await onBusterSearch({
          query,
          include
        });
      } else if (type === 'dashboard') {
        include = ['exclude_threads'];
        results = await onBusterSearch({
          query,
          include
        });
      }
      if (isEmpty(initialSearchItems) && !query) {
        setInitialSearchItems(results);
        addToAllSeenItems(results);
      }
      setLoadedInitialSearchItems(true);
      setOngoingSearchItems(results);
      addToAllSeenItems(results);
      return results;
    },
    { wait: 400 }
  );

  const initSelectedItems = useMemoizedFn(() => {
    if (dashboardResponse) {
      const objectMetrics = dashboardResponse.metrics.reduce<Record<string, boolean>>(
        (acc, metric) => {
          acc[metric.id] = true;
          return acc;
        },
        {}
      );
      setSelectedItemIds(objectMetrics);
    } else if (collection) {
      const objectMetrics = (collection.assets || []).reduce<Record<string, boolean>>(
        (acc, asset) => {
          acc[asset.id] = true;
          return acc;
        },
        {}
      );
      setSelectedItemIds(objectMetrics);
    }
  });

  const onSubmit = useMemoizedFn(async () => {
    setSubmitting(true);
    const selectedIds = Object.entries(selectedItemIds)
      .filter(([, value]) => value)
      .map(([key]) => key);

    if (type === 'collection') {
      const assets = selectedIds.map((id) => {
        const type = allSeenItems.current[id]?.type;
        return {
          type,
          id
        };
      });
      await onBulkAddRemoveToCollection({
        collectionId: collection!.id,
        assets
      });
    } else if (type === 'dashboard') {
      await onBulkAddRemoveToDashboard({
        dashboardId: dashboard!.id,
        threadIds: selectedIds
      });
      await refreshDashboard(dashboard!.id);
    }
    setSubmitting(false);
    return;
  });

  const onModalOkay = useMemoizedFn(async () => {
    await onSubmit();
    onClose();
  });

  const onChangeSearchInput = useMemoizedFn((value: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(value.target.value);
    onSearchInput.run(value.target.value);
  });

  const memoizedModalStyle = useMemo(() => {
    return {
      footer: { borderTop: `0.5px solid ${token.colorBorder}` }
    };
  }, [token.colorBorder]);

  const memoizedModalClassNames = useMemo(() => {
    return {
      body: '!p-0 mb-[-1px]',
      footer: '!mt-0 !px-3 !py-3'
    };
  }, []);

  const memoizedCancelButtonProps = useMemo(() => {
    return {
      type: 'text' as 'text'
    };
  }, []);

  useLayoutEffect(() => {
    if (open) {
      setInputValue('');
      initSelectedItems();
      setTimeout(() => {
        onSetSelectedFilter(filterOptions[0]!.value);
      }, 20);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }

    if (!mountedInitial.current) {
      onSearchInput.run('');
      mountedInitial.current = true;
    }
  }, [open]);

  return (
    <Modal
      open={open}
      closeIcon={type === 'collection' ? null : undefined}
      onCancel={onClose}
      onClose={onClose}
      width={800}
      footer={
        <ModalFooter
          type={type}
          onOk={onModalOkay}
          selectedItemIds={selectedItemIds}
          submitting={submitting}
          onCancel={onClose}
          dashboardResponse={dashboardResponse}
          collection={collection}
        />
      }
      styles={memoizedModalStyle}
      classNames={memoizedModalClassNames}
      cancelButtonProps={memoizedCancelButtonProps}>
      <ModalContent
        type={type}
        dashboardResponse={dashboardResponse}
        collection={collection}
        selectedFilter={selectedFilter}
        onSetSelectedFilter={onSetSelectedFilter}
        inputValue={inputValue}
        onChangeSearchInput={onChangeSearchInput}
        inputRef={inputRef}
        scrollContainerRef={scrollContainerRef}
        rows={rows}
        columns={columns}
        loadedInitialSearchItems={loadedInitialSearchItems}
        selectedItemIdsKeys={selectedItemIdsKeys}
        onSelectChange={onSelectChange}
        onClose={onClose}
      />
    </Modal>
  );
});

AddTypeModal.displayName = 'AddTypeModal';

const ModalContent: React.FC<{
  type: 'collection' | 'dashboard';
  dashboardResponse?: BusterDashboardResponse;
  collection?: BusterCollection;
  selectedFilter: string;
  onSetSelectedFilter: (value: string) => void;
  inputValue: string;
  onChangeSearchInput: (value: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<InputRef>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  rows: BusterListRow[];
  columns: BusterListColumn[];
  loadedInitialSearchItems: boolean;
  selectedItemIdsKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  onClose: () => void;
}> = React.memo(
  ({
    type,
    selectedFilter,
    onSetSelectedFilter,
    inputValue,
    onChangeSearchInput,
    inputRef,
    scrollContainerRef,
    rows,
    columns,
    loadedInitialSearchItems,
    selectedItemIdsKeys,
    onSelectChange,
    onClose
  }) => {
    const onSetSelectedFiltersPreflight = useMemoizedFn((value: SegmentedValue) => {
      onSetSelectedFilter(value as string);
    });

    return (
      <>
        {type === 'collection' && (
          <div className="flex items-center justify-between px-4 py-2">
            <AppSegmented
              options={filterOptions}
              value={selectedFilter}
              onChange={onSetSelectedFiltersPreflight}
            />

            <Button type="text" onClick={onClose} icon={<AppMaterialIcons icon="close" />} />
          </div>
        )}

        <Divider className="!my-0" />

        <div className="flex h-[48px] items-center space-x-2">
          <Input
            ref={inputRef}
            prefix={<AppMaterialIcons icon="search" size={22} />}
            size="large"
            className=""
            variant="borderless"
            placeholder={
              type === 'collection'
                ? 'Search for existing metrics and dashboards...'
                : 'Search for existing metrics...'
            }
            value={inputValue}
            onChange={onChangeSearchInput}
          />
        </div>

        {<Divider />}

        <div
          className="max-h-[57vh] overflow-auto"
          ref={scrollContainerRef}
          style={{
            height: rows.length === 0 ? 150 : rows.length * 48 + 32
          }}>
          <BusterList
            selectedRowKeys={selectedItemIdsKeys}
            onSelectChange={onSelectChange}
            rows={rows}
            showSelectAll={false}
            columns={columns}
            emptyState={
              loadedInitialSearchItems ? (
                <div className="flex h-[200px] min-h-[200px] items-center justify-center">
                  <Text type="tertiary">No metrics or dashboards found</Text>
                </div>
              ) : (
                <div className="min-h-[200px flex h-[200px] items-center justify-center">
                  <CircleSpinnerLoaderContainer />
                </div>
              )
            }
          />
        </div>
      </>
    );
  }
);

ModalContent.displayName = 'ModalContent';
const ModalFooter: React.FC<{
  onOk: () => void;
  onCancel: () => void;
  type: 'collection' | 'dashboard';
  submitting: boolean;
  selectedItemIds: Record<string, boolean>;
  dashboardResponse?: BusterDashboardResponse;
  collection?: BusterCollection;
}> = React.memo(({ dashboardResponse, submitting, selectedItemIds, type, onOk, onCancel }) => {
  const copyText =
    type === 'collection'
      ? `Select the metrics & dashboards that you would like to add to your collection.`
      : '';

  const disabled = useMemo(() => {
    if (isEmpty(selectedItemIds)) return true;

    if (dashboardResponse) {
      const metricIds = dashboardResponse.metrics.map((metric) => metric.id);
      const allSelectedIds = Object.entries(selectedItemIds)
        .filter(([, value]) => value)
        .map(([key]) => key);
      if (metricIds.length !== allSelectedIds.length) return false;
      const allAreSelected = metricIds.every((id) => selectedItemIds[id]);
      return allAreSelected;
    }

    return false;
  }, [selectedItemIds, dashboardResponse]);

  return (
    <div className="flex w-full items-center justify-between">
      <Text type="secondary">{copyText}</Text>

      <div className="flex space-x-2">
        <Button type="text" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={disabled} loading={submitting} type="primary" onClick={onOk}>
          Apply
        </Button>
      </div>
    </div>
  );
});

ModalFooter.displayName = 'ModalFooter';

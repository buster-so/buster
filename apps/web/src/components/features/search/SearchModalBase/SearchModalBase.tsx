/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: I know what I'm doing */

import type { AssetType } from '@buster/server-shared/assets';
import type { SearchTextData, SearchTextResponse } from '@buster/server-shared/search';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import { Plus } from '@/components/ui/icons';
import { createChatRecord } from '@/components/ui/list/createChatRecord';
import { SearchModal } from '@/components/ui/search/SearchModal';
import type {
  SearchItem,
  SearchItemGroup,
  SearchItems,
  SearchModalProps,
} from '@/components/ui/search/SearchModal/search-modal.types';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { timeFromNow } from '@/lib/date';
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import { assetTypeToIcon } from '../../icons/assetIcons';
import { SearchModalSecondaryContent } from './SearchModalSecondaryContent';

export type SearchModalBaseContentProps<M = unknown, T extends string = string> = Pick<
  NonNullable<SearchModalProps<M, T>>,
  | 'value'
  | 'onChangeValue'
  | 'loading'
  | 'scrollContainerRef'
  | 'filterContent'
  | 'footerConfig'
  | 'filterDropdownContent'
> & {
  items: SearchTextResponse['data'];
  isOpen: boolean;
  onClose: () => void;
};

type SearchModalNavigateProps = {
  mode: 'navigate';
  onSelect?: (item: SearchTextData) => void | Promise<void>;
};

type SearchModalSelectSingleProps = {
  mode: 'select-single';
  onSelect: (item: { assetId: string; assetType: AssetType } | null) => void | Promise<void>;
  selectedItem: string;
};

type SearchModalSelectMultipleProps = {
  mode: 'select-multiple';
  onSelect: (itemKey: string, wasInLibrary: boolean) => void | Promise<void>;
  isItemSelected: (itemKey: string) => boolean;
};

type SearchModalBaseProps = (
  | SearchModalNavigateProps
  | SearchModalSelectSingleProps
  | SearchModalSelectMultipleProps
) &
  SearchModalBaseContentProps;

// Helper functions for composite keys
export const createSelectionKey = (assetId: string, assetType: AssetType) =>
  `${assetId}:${assetType}`;

export const parseSelectionKey = (key: string): { assetId: string; assetType: AssetType } => {
  const [assetId, assetType] = key.split(':', 2);
  return { assetId, assetType: assetType as AssetType };
};

export const SearchModalBase = (props: SearchModalBaseProps) => {
  const {
    value,
    items,
    onChangeValue,
    loading = false,
    scrollContainerRef,
    isOpen,
    mode,
    filterContent,
    onClose,
    footerConfig,
    filterDropdownContent,
  } = props;

  const navigate = useNavigate();
  const [viewedItem, setViewedItem] = useState<SearchTextData | null>(null);

  const showBottomLoading = items.length >= 20;
  const openSecondaryContent = !!value;

  const onSelectItem = useMemoizedFn(async (item: SearchTextData) => {
    if (mode === 'navigate') {
      await props.onSelect?.(item);
      const link = createSimpleAssetRoute({
        asset_type: item.assetType,
        id: item.assetId,
      }) as Parameters<typeof navigate>[0];
      await navigate({ ...link, reloadDocument: true });
      return;
    }

    if (mode === 'select-multiple') {
      const itemKey = createSelectionKey(item.assetId, item.assetType);
      await props.onSelect(itemKey, item.addedToLibrary ?? false);
      return;
    }

    if (mode === 'select-single') {
      const newItem = item.assetId === props.selectedItem ? null : item.assetId;
      await props.onSelect?.(newItem ? { assetId: newItem, assetType: item.assetType } : null);
      return;
    }

    const _exhaustiveCheck: never = mode;
    throw new Error(`Invalid mode: ${_exhaustiveCheck}`);
  });

  const getSelected = useCallback(
    (item: SearchTextData): boolean => {
      // Handle select-multiple mode with library tracking
      if (mode === 'select-multiple') {
        const itemKey = createSelectionKey(item.assetId, item.assetType);
        const hasPendingChange = props.isItemSelected(itemKey);

        // If item was in library: show selected unless marked for removal
        if (item.addedToLibrary) {
          return !hasPendingChange; // invert: pending means removing
        }

        // If item wasn't in library: show selected if marked for addition
        return hasPendingChange;
      }

      // Handle select-single mode
      if (mode === 'select-single') {
        return item.assetId === props.selectedItem;
      }

      // Navigate mode or items with addedToLibrary flag
      return item.addedToLibrary || false;
    },
    [
      mode,
      (props as SearchModalSelectSingleProps).selectedItem,
      (props as SearchModalSelectMultipleProps).isItemSelected,
    ]
  );

  const makeItem = (item: SearchTextData, makeSecondary?: boolean): SearchItem => {
    const Icon = assetTypeToIcon(item.assetType);

    return {
      label: <span dangerouslySetInnerHTML={{ __html: item.title }} />,
      icon: <Icon />,
      value: item.assetId,
      type: 'item',
      tertiaryLabel: timeFromNow(item.updatedAt),
      secondaryLabel:
        makeSecondary && item.additionalText ? (
          <span
            className="line-clamp-1"
            dangerouslySetInnerHTML={{ __html: item.additionalText }}
          />
        ) : undefined,
      onSelect: async () => onSelectItem(item),
      selected: getSelected(item),
    };
  };

  const searchItems: SearchItems[] = useMemo(() => {
    if (openSecondaryContent) {
      const allItems: SearchItem[] = items.map((item) => makeItem(item, true));
      return [
        {
          type: 'group',
          label: 'Best matches',
          items: allItems,
        },
      ];
    }

    const todayAndYesterday = createChatRecord(items, 'updatedAt');
    const translations: Record<keyof typeof todayAndYesterday, string> = {
      TODAY: 'Today',
      YESTERDAY: 'Yesterday',
      LAST_WEEK: 'Last Week',
      ALL_OTHERS: 'All Others',
    };

    return [
      {
        type: 'group',
        label: 'Actions',
        items: [
          {
            label: 'Create new chat',
            value: 'create-new-chat',
            type: 'item',
            icon: <Plus />,
            onSelect: async () => {
              await navigate({ to: '/app/home' });
              onClose();
            },
          },
        ],
        display: mode === 'navigate',
      },
      ...Object.entries(todayAndYesterday).map<SearchItemGroup & { display: boolean }>(
        ([key, value]) => ({
          type: 'group',
          label: translations[key as keyof typeof translations],
          items: value.map((item) => makeItem(item, false)),
          display: value.length > 0,
        })
      ),
    ].filter((x) => x.display !== false) as SearchItems[];
  }, [items, openSecondaryContent, getSelected, onSelectItem, mode]);

  const onViewSearchItem = useMemoizedFn((item: SearchItem) => {
    const foundItem = items.find((x) => x.assetId === item.value);
    setViewedItem(foundItem ?? null);
  });

  return (
    <SearchModal
      className="search-bold"
      open={isOpen}
      onClose={onClose}
      value={value}
      searchItems={searchItems}
      onChangeValue={onChangeValue}
      onViewSearchItem={onViewSearchItem}
      placeholder="Search..."
      loading={loading}
      showTopLoading={true}
      showBottomLoading={showBottomLoading}
      scrollContainerRef={scrollContainerRef}
      openSecondaryContent={openSecondaryContent && !!viewedItem}
      shouldFilter={false}
      filterContent={filterContent}
      filterDropdownContent={filterDropdownContent}
      mode={mode}
      footerConfig={footerConfig}
      secondaryContent={useMemo(() => {
        return viewedItem ? <SearchModalSecondaryContent selectedItem={viewedItem} /> : null;
      }, [viewedItem])}
    />
  );
};

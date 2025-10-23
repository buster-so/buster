/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: I know what I'm doing */
import type { SearchTextData, SearchTextResponse } from '@buster/server-shared/search';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
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
  'value' | 'onChangeValue' | 'loading' | 'scrollContainerRef' | 'filterContent'
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
  onSelect: (item: string | null) => void | Promise<void>;
  selectedItem: string;
};

type SearchModalSelectMultipleProps = {
  mode: 'select-multiple';
  onSelect: (items: Set<string>) => void | Promise<void>;
  selectedItems: Set<string>;
};

type SearchModalBaseProps = (
  | SearchModalNavigateProps
  | SearchModalSelectSingleProps
  | SearchModalSelectMultipleProps
) &
  SearchModalBaseContentProps;

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
    onSelect,
  } = props;

  const navigate = useNavigate();
  const [viewedItem, setViewedItem] = useState<SearchTextData | null>(null);

  const showBottomLoading = items.length >= 20;
  const openSecondaryContent = !!value;

  // const resetModal = () => {
  //   setViewedItem(null);
  //   onChangeValue('');
  // };

  const onSelectItem = useMemoizedFn(async (item: SearchTextData) => {
    if (mode === 'navigate') {
      const link = createSimpleAssetRoute({
        asset_type: item.assetType,
        id: item.assetId,
      }) as Parameters<typeof navigate>[0];
      await navigate({ ...link, reloadDocument: true });
      return;
    }

    if (mode === 'select-single') {
      const newItem = item.assetId === props.selectedItem ? null : item.assetId;
      await onSelect?.(newItem);
      return;
    }

    if (mode === 'select-multiple') {
      const newItems = new Set(props.selectedItems);
      newItems.has(item.assetId) ? newItems.delete(item.assetId) : newItems.add(item.assetId);
      await onSelect(newItems);
      return;
    }

    const _exhaustiveCheck: never = mode;
    throw new Error(`Invalid mode: ${_exhaustiveCheck}`);
  });

  const searchItems: SearchItems[] = useMemo(() => {
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
      };
    };

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
  }, [items, openSecondaryContent]);

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
      secondaryContent={useMemo(() => {
        return viewedItem ? <SearchModalSecondaryContent selectedItem={viewedItem} /> : null;
      }, [viewedItem])}
    />
  );
};

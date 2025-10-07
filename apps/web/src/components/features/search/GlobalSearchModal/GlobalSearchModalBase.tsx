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
import { useWhyDidYouUpdate } from '@/hooks/useWhyDidYouUpdate';
import { GlobalSearchSecondaryContent } from './GlobalSearchSecondaryContent';
import { useGlobalSearchStore } from './global-search-store';

export type GlobalSearchModalBaseProps<M = unknown, T extends string = string> = Pick<
  NonNullable<SearchModalProps<M, T>>,
  'value' | 'onChangeValue' | 'loading' | 'scrollContainerRef' | 'openSecondaryContent'
> & {
  items: SearchTextResponse['data'];
};

export const GlobalSearchModalBase = ({
  value,
  items,
  onChangeValue,
  loading,
  openSecondaryContent,
  scrollContainerRef,
}: GlobalSearchModalBaseProps) => {
  const { isOpen, onClose } = useGlobalSearchStore();
  const navigate = useNavigate();
  const [viewedItem, setViewedItem] = useState<SearchTextData | null>(null);

  const searchItems: SearchItems[] = useMemo(() => {
    if (openSecondaryContent) {
      const allItems: SearchItem[] = items.map((item) => ({
        label: <span dangerouslySetInnerHTML={{ __html: item.title }} />,
        value: item.assetId,
        type: 'item',
      }));

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
        display: true,
      },
      ...Object.entries(todayAndYesterday).map<SearchItemGroup & { display: boolean }>(
        ([key, value]) => ({
          type: 'group',
          label: translations[key as keyof typeof translations],
          items: value.map((item) => ({
            label: item.title,
            value: item.assetId,
            type: 'item',
          })),
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
      secondaryContent={useMemo(() => {
        return viewedItem ? <GlobalSearchSecondaryContent selectedItem={viewedItem} /> : null;
      }, [viewedItem])}
      placeholder="Search..."
      loading={loading}
      showTopLoading={false}
      scrollContainerRef={scrollContainerRef}
      openSecondaryContent={openSecondaryContent && !!viewedItem}
      shouldFilter={false}
    />
  );
};

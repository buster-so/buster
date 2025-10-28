import { useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import pluralize from 'pluralize';
import React, { useMemo } from 'react';
import XMark from '@/components/ui/icons/NucleoIconOutlined/xmark';
import type { computeLibraryFilters } from '@/controllers/LibraryController/compute-library-filters';
import type {
  LibrarySearchParams,
  SharedWithMeSearchParams,
} from '@/controllers/LibraryController/schema';
import { assetTypeLabel } from '@/lib/assets/asset-translations';
import { dateSpansIntoPreviousYears, formatDate, isYesterday } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { FiltersParams, OnSetFiltersParams } from './useCommonSearch';

type FilterPill<T = string> = { title: string; value: T; subTitle?: string; onRemove?: () => void };

const FilterPillsContainer = <T = string>({
  pills,
  className,
}: {
  pills: FilterPill<T>[];
  className?: string;
}) => {
  const show = pills.length > 0;
  return (
    <AnimatePresence initial={false} mode="wait">
      {show && (
        <motion.div
          key="filter-pills"
          className={cn(
            'overflow-x-auto overflow-y-hidden w-full flex items-center px-4.5 gap-2',
            className
          )}
          initial={{
            opacity: 0,
            height: '0px',
          }}
          animate={{
            opacity: 1,
            height: '40px',
          }}
          exit={{ opacity: 0, height: '0px' }}
          transition={{
            height: { duration: 0.1 },
            opacity: { duration: 0.07 },
          }}
        >
          {pills.map((pill) => (
            <FilterPill key={pill.value as string} {...pill} />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const FilterPill = <T = string>({ title, value, subTitle, onRemove }: FilterPill<T>) => {
  return (
    <div
      className="px-2 pr-1 h-6 items-center rounded border flex"
      data-testid={`filter-pill-${value}`}
    >
      <span className="text-base pr-1 max-w-[200px] truncate">
        {subTitle ? `${title}: ${subTitle}` : title}
      </span>

      {onRemove && (
        <React.Fragment>
          <div className="self-stretch border-l -my-0 mx-1" />
          <button
            type="button"
            className="hover:bg-item-hover rounded-sm p-0.5 cursor-pointer"
            onClick={() => onRemove?.()}
          >
            <XMark />
          </button>
        </React.Fragment>
      )}
    </div>
  );
};

export const FilterSearchPills: React.FC<FiltersParams & OnSetFiltersParams> = (params) => {
  const pills = useMemo(() => {
    const pills: FilterPill<keyof FiltersParams>[] = [];
    const { selectedDateRange, selectedAssets, setSelectedAssets, setSelectedDateRange, ...rest } =
      params;
    if (params.selectedDateRange?.from || params.selectedDateRange?.to) {
      pills.push({
        title: 'Date range',
        value: 'selectedDateRange',
        subTitle: `${formatDate({
          date: params.selectedDateRange.from || new Date(),
          format: 'LL',
        })} - ${formatDate({
          date: params.selectedDateRange.to || new Date(),
          format: 'LL',
        })}`,
      });
    }
    if (params.selectedAssets && params.selectedAssets.length > 0) {
      pills.push({
        title: 'Assets',
        value: 'selectedAssets',
        subTitle: params.selectedAssets.map((x) => assetTypeLabel(x)).join(', '),
        onRemove: () => setSelectedAssets(null),
      });
    }

    // Exhaustive check: errors if any properties aren't handled above
    const _exhaustiveCheck: Record<string, never> = rest;

    return pills;
  }, [params]);

  return <FilterPillsContainer pills={pills} className="border-t" />;
};

export const FilterLibraryPills: React.FC<
  ReturnType<typeof computeLibraryFilters> & {
    filter: LibrarySearchParams['filter'] | SharedWithMeSearchParams['filter'];
    type: 'library' | 'shared-with-me';
  }
> = (params) => {
  const navigate = useNavigate();

  const allPills: FilterPill<string>[] = useMemo(() => {
    const pills: FilterPill<string>[] = [];

    const {
      assetTypes,
      ordering,
      orderingDirection,
      startDate,
      endDate,
      groupBy,
      filter,
      includeCreatedBy,
      type,
    } = params;

    if (startDate || endDate) {
      const isStartDateYesterday = startDate && isYesterday(startDate);
      const startDateSpansIntoPreviousYears = startDate && dateSpansIntoPreviousYears(startDate);
      let subTitle = '';
      if (isStartDateYesterday) {
        subTitle = 'Yesterday';
      } else {
        const format = startDateSpansIntoPreviousYears ? 'MMM D, YYYY' : 'MMM D';
        subTitle = `${formatDate({ date: startDate || new Date(), format })} - ${formatDate({ date: endDate || new Date(), format: format })}`;
      }

      pills.push({
        title: 'Date range',
        value: 'dateRange',
        subTitle: subTitle,
        onRemove: () => {
          navigate({
            to: type === 'library' ? '/app/library' : '/app/shared-with-me',
            search: (prev) => ({ ...prev, start_date: undefined, end_date: undefined }),
          });
        },
      });
    }

    if (assetTypes && assetTypes.length > 0) {
      pills.push({
        title: 'Asset types',
        value: 'asset_types',
        subTitle: assetTypes.map((x) => assetTypeLabel(x)).join(', '),
        onRemove: () =>
          navigate({
            to: type === 'library' ? '/app/library' : '/app/shared-with-me',
            search: (prev) => ({ ...prev, asset_types: undefined, filter: undefined }),
          }),
      });
    }

    if (ordering) {
      const translation: Record<NonNullable<LibrarySearchParams['ordering']>, string> = {
        updated_at: 'Updated at',
        created_at: 'Created at',
        none: 'Updated at',
      };

      pills.push({
        title: 'Ordering',
        value: 'ordering',
        subTitle: translation[ordering],
        onRemove: () =>
          navigate({
            to: type === 'library' ? '/app/library' : '/app/shared-with-me',
            search: (prev) => ({ ...prev, ordering: undefined }),
          }),
      });
    }

    if (orderingDirection) {
      const translation: Record<
        NonNullable<NonNullable<LibrarySearchParams['ordering_direction']>>,
        string
      > = {
        asc: 'Ascending',
        desc: 'Descending',
      };

      pills.push({
        title: 'Ordering direction',
        value: 'orderingDirection',
        subTitle: translation[orderingDirection],
        onRemove: () =>
          navigate({
            to: type === 'library' ? '/app/library' : '/app/shared-with-me',
            search: (prev) => ({ ...prev, orderingDirection: undefined }),
          }),
      });
    }

    if (groupBy && groupBy !== 'none') {
      const translation: Record<NonNullable<LibrarySearchParams['group_by']>, string> = {
        asset_type: 'Asset type',
        created_at: 'Created at',
        updated_at: 'Updated at',
        none: 'None',
        owner: 'Owner',
      };

      pills.push({
        title: 'Group by',
        value: 'groupBy',
        subTitle: translation[groupBy],
        onRemove: () =>
          navigate({
            to: type === 'library' ? '/app/library' : '/app/shared-with-me',
            search: (prev) => ({ ...prev, group_by: undefined }),
          }),
      });
    }

    if (includeCreatedBy && includeCreatedBy.length > 0) {
      if (!(filter === 'owned_by_me' && includeCreatedBy.length === 1 && type === 'library')) {
        pills.push({
          title: 'Owner',
          value: 'includeCreatedBy',
          subTitle: `${pluralize('user', includeCreatedBy.length, true)}`,
          onRemove: () =>
            navigate({
              to: type === 'library' ? '/app/library' : '/app/shared-with-me',
              search: (prev) => ({ ...prev, owner_ids: undefined }),
            }),
        });
      }
    }

    return pills;
  }, [params]);

  return <FilterPillsContainer pills={allPills} className="border-b" />;
};

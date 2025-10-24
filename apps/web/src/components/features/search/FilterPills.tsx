import { AnimatePresence, motion } from 'framer-motion';
import isEmpty from 'lodash/isEmpty';
import React, { useMemo } from 'react';
import XMark from '@/components/ui/icons/NucleoIconOutlined/xmark';
import type { LibrarySearchParams } from '@/controllers/LibraryController/schema';
import { assetTypeLabel } from '@/lib/assets/asset-translations';
import { formatDate } from '@/lib/date';
import type { FiltersParams, OnSetFiltersParams } from './useCommonSearch';

type FilterPill<T = string> = { title: string; value: T; subTitle?: string; onRemove?: () => void };

const FilterPillsContainer = <T = string>({
  pills,
  show,
}: {
  pills: FilterPill<T>[];
  show: boolean;
}) => {
  return (
    <AnimatePresence initial={true} mode="wait">
      {show && (
        <motion.div
          key="filter-pills"
          className="overflow-x-auto overflow-y-hidden w-full flex items-center px-5 border-t gap-2"
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
            height: { duration: 0.15 },
            opacity: { duration: 0.12 },
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
            className="hover:bg-item-hover rounded-sm p-0.5"
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
  const hasFilters = useMemo(() => Object.values(params).some((x) => !isEmpty(x)), [params]);

  const pills = useMemo(() => {
    const pills: FilterPill<keyof FiltersParams>[] = [];
    const { selectedDateRange, selectedAssets, setSelectedAssets, setSelectedDateRange, ...rest } =
      params;
    if (params.selectedDateRange) {
      pills.push({
        title: 'Date range',
        value: 'selectedDateRange',
        subTitle: `${formatDate({
          date: params.selectedDateRange.from,
          format: 'LL',
        })} - ${formatDate({
          date: params.selectedDateRange.to,
          format: 'LL',
        })}`,
      });
    }
    if (params.selectedAssets) {
      pills.push({
        title: 'Assets',
        value: 'selectedAssets',
        subTitle: params.selectedAssets.map((x) => assetTypeLabel(x)).join(', '),
        onRemove: () => setSelectedAssets(null),
      });
    }

    // biome-ignore lint/complexity/noBannedTypes: exhaustive check
    const _exhaustiveCheck: {} = params;

    return pills;
  }, [params]);

  return <FilterPillsContainer pills={pills} show={hasFilters} />;
};

export const FilterLibraryPills: React.FC<LibrarySearchParams> = (params) => {
  return <FilterPillsContainer pills={[]} show={false} />;
};

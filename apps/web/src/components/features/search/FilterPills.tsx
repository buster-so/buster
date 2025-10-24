import { AnimatePresence, motion } from 'framer-motion';
import isEmpty from 'lodash/isEmpty';
import type React from 'react';
import { useMemo } from 'react';
import type { FiltersParams, OnSetFiltersParams } from './useCommonSearch';

export const FilterPills: React.FC<FiltersParams & OnSetFiltersParams> = (params) => {
  const hasFilters = useMemo(() => Object.values(params).some((x) => !isEmpty(x)), [params]);

  return (
    <AnimatePresence initial={true} mode="wait">
      {hasFilters && (
        <motion.div
          key="filter-pills"
          className="overflow-hidden w-full flex items-center px-5 border-t"
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
          asdf
        </motion.div>
      )}
    </AnimatePresence>
  );
};

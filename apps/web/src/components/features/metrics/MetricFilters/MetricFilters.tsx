import type { MetricFilter } from '@buster/server-shared/metrics';
import React, { useState } from 'react';
import { Input } from '@/components/ui/inputs/Input';
import { cn } from '@/lib/utils';

interface MetricFiltersProps {
  filters: MetricFilter[] | undefined;
  onFilterValuesChange: (filterValues: Record<string, unknown>) => void;
  className?: string;
}

export const MetricFilters: React.FC<MetricFiltersProps> = ({
  filters,
  onFilterValuesChange,
  className,
}) => {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  if (!filters || filters.length === 0) {
    return null;
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilterValues = { ...filterValues, [key]: value };
    setFilterValues(newFilterValues);

    // Convert values to appropriate types
    const typedValues: Record<string, unknown> = {};
    Object.entries(newFilterValues).forEach(([filterKey, filterValue]) => {
      const filter = filters.find((f) => f.key === filterKey);
      if (!filter || !filterValue) return;

      // Parse values based on filter type
      if (filter.type === 'number') {
        typedValues[filterKey] = Number(filterValue);
      } else if (filter.type === 'string_list' || filter.type === 'number_list') {
        const listValues = filterValue.split(',').map((v) => v.trim());
        typedValues[filterKey] =
          filter.type === 'number_list' ? listValues.map(Number) : listValues;
      } else if (filter.type === 'boolean') {
        typedValues[filterKey] = filterValue.toLowerCase() === 'true';
      } else {
        typedValues[filterKey] = filterValue;
      }
    });

    onFilterValuesChange(typedValues);
  };

  return (
    <div className={cn('bg-muted/50 border-border flex flex-wrap gap-3 border-b p-3', className)}>
      {filters.map((filter) => (
        <div key={filter.key} className="flex items-center gap-2">
          <label htmlFor={filter.key} className="text-muted-foreground text-sm font-medium">
            {filter.key}:
          </label>
          <Input
            id={filter.key}
            type="text"
            value={filterValues[filter.key] || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            placeholder={getPlaceholder(filter)}
            className="h-8 w-48"
          />
        </div>
      ))}
    </div>
  );
};

function getPlaceholder(filter: MetricFilter): string {
  if (filter.type === 'string_list' || filter.type === 'number_list') {
    return 'value1, value2, value3';
  }
  if (filter.type === 'number') {
    return 'Enter number';
  }
  if (filter.type === 'boolean') {
    return 'true or false';
  }
  if (filter.type === 'date' || filter.type === 'timestamp') {
    return 'YYYY-MM-DD';
  }
  if (filter.type === 'daterange' || filter.type === 'timestamp_range') {
    return 'start, end';
  }
  return 'Enter value';
}

import type { MetricFilter } from '@buster/server-shared/metrics';
import React, { useState } from 'react';
import { Input } from '@/components/ui/inputs/Input';
import { cn } from '@/lib/utils';

interface DashboardFiltersProps {
  commonFilters: MetricFilter[];
  onFilterValuesChange: (filterValues: Record<string, unknown>) => void;
  showMetricFilters: boolean;
  onToggleMetricFilters: () => void;
  className?: string;
}

const COMPARISON_OPERATORS = ['=', '!=', '>', '>=', '<', '<=', 'like', 'ilike'] as const;

// Modes that support comparison operators
const MODES_SUPPORTING_OPERATORS = new Set(['predicate', 'join_predicate', 'qualify', 'having']);

function canUseOperator(filter: MetricFilter): boolean {
  return MODES_SUPPORTING_OPERATORS.has(filter.mode);
}

const CUSTOM_VALUE_KEY = '__custom__';

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  commonFilters,
  onFilterValuesChange,
  showMetricFilters,
  onToggleMetricFilters,
  className,
}) => {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [filterOperators, setFilterOperators] = useState<Record<string, string>>({});
  const [customMode, setCustomMode] = useState<Record<string, boolean>>({});

  const hasCommonFilters = commonFilters && commonFilters.length > 0;

  const handleInputChange = (key: string, value: string) => {
    setFilterValues({ ...filterValues, [key]: value });
  };

  const handleEnumChange = (key: string, value: string) => {
    if (value === CUSTOM_VALUE_KEY) {
      setCustomMode({ ...customMode, [key]: true });
      setFilterValues({ ...filterValues, [key]: '' });
    } else {
      const newFilterValues = { ...filterValues, [key]: value };
      setCustomMode({ ...customMode, [key]: false });
      setFilterValues(newFilterValues);

      // Immediately process the enum selection
      processFilterValues(newFilterValues, filterOperators);
    }
  };

  const handleOperatorChange = (key: string, op: string) => {
    setFilterOperators({ ...filterOperators, [key]: op });
  };

  const processFilterValues = (
    currentFilterValues: Record<string, string>,
    currentFilterOperators: Record<string, string>
  ) => {
    // Convert values to appropriate types
    const typedValues: Record<string, unknown> = {};
    Object.entries(currentFilterValues).forEach(([filterKey, filterValue]) => {
      const filter = commonFilters.find((f) => f.key === filterKey);
      if (!filter || !filterValue) return;

      let parsedValue: unknown;

      // Parse values based on filter type
      if (filter.type === 'number') {
        parsedValue = Number(filterValue);
      } else if (filter.type === 'string_list' || filter.type === 'number_list') {
        const listValues = filterValue.split(',').map((v) => v.trim());
        parsedValue = filter.type === 'number_list' ? listValues.map(Number) : listValues;
      } else if (filter.type === 'daterange' || filter.type === 'timestamp_range') {
        const rangeValues = filterValue.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        parsedValue = rangeValues;
      } else if (filter.type === 'boolean') {
        parsedValue = filterValue.toLowerCase() === 'true';
      } else {
        parsedValue = filterValue;
      }

      // Check if we should include operator override
      const operator = currentFilterOperators[filterKey];
      const shouldIncludeOperator = operator && canUseOperator(filter);

      if (shouldIncludeOperator) {
        typedValues[filterKey] = { value: parsedValue, op: operator };
      } else {
        typedValues[filterKey] = parsedValue;
      }
    });

    onFilterValuesChange(typedValues);
  };

  const handleBlur = () => {
    processFilterValues(filterValues, filterOperators);
  };

  return (
    <div className={cn('bg-muted/50 border-border flex flex-wrap items-center gap-3 border-b p-4', className)}>
      {hasCommonFilters && (
        <>
          <div className="text-sm font-semibold mr-2">Dashboard Filters:</div>
          {commonFilters.map((filter) => {
            const hasEnum = filter.validate?.enum && filter.validate.enum.length > 0;
            const isCustomMode = customMode[filter.key];

            return (
              <div key={filter.key} className="flex items-center gap-2">
                <label htmlFor={`dashboard-${filter.key}`} className="text-muted-foreground text-sm font-medium">
                  {filter.key}:
                </label>
                {canUseOperator(filter) && (
                  <select
                    value={filterOperators[filter.key] || filter.op || '='}
                    onChange={(e) => handleOperatorChange(filter.key, e.target.value)}
                    onBlur={handleBlur}
                    className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {COMPARISON_OPERATORS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                )}
                {hasEnum && !isCustomMode ? (
                  <select
                    id={`dashboard-${filter.key}`}
                    value={filterValues[filter.key] || ''}
                    onChange={(e) => handleEnumChange(filter.key, e.target.value)}
                    className="h-8 w-48 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="">Select value...</option>
                    {filter.validate!.enum!.map((enumValue) => (
                      <option key={String(enumValue)} value={String(enumValue)}>
                        {String(enumValue)}
                      </option>
                    ))}
                    <option value={CUSTOM_VALUE_KEY}>Custom...</option>
                  </select>
                ) : (
                  <Input
                    id={`dashboard-${filter.key}`}
                    type="text"
                    value={filterValues[filter.key] || ''}
                    onChange={(e) => handleInputChange(filter.key, e.target.value)}
                    onBlur={handleBlur}
                    placeholder={getPlaceholder(filter)}
                    className="h-8 w-48"
                  />
                )}
              </div>
            );
          })}
        </>
      )}
      <button
        onClick={onToggleMetricFilters}
        className={cn(
          'rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent',
          hasCommonFilters && 'ml-auto'
        )}
      >
        {showMetricFilters ? 'Hide' : 'Show'} Metric Filters
      </button>
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

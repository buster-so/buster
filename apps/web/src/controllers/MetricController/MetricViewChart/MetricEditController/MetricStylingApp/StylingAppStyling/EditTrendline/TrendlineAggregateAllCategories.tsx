import React from 'react';
import { Switch } from '@/components/ui/switch';
import { LabelAndInput } from '../../Common';
import type { LoopTrendline } from './EditTrendline';

interface TrendlineAggregateAllCategoriesProps {
  trend: LoopTrendline;
  onUpdateExistingTrendline: (trend: LoopTrendline) => void;
  categoryEncodes: string[] | null | undefined;
}

export const TrendlineAggregateAllCategories: React.FC<TrendlineAggregateAllCategoriesProps> =
  React.memo(({ trend, onUpdateExistingTrendline, categoryEncodes }) => {
    const hasCategoryEncodes = categoryEncodes && categoryEncodes.length > 0;

    if (!hasCategoryEncodes) {
      return null;
    }

    const handleChange = (checked: boolean) => {
      onUpdateExistingTrendline({
        ...trend,
        aggregateAllCategories: checked
      });
    };

    return (
      <LabelAndInput
        label={'Aggregate'}
        labelInfoTooltip="Aggregate all categories into a single trendline">
        <div className="flex w-full justify-end">
          <Switch checked={trend.aggregateAllCategories ?? true} onCheckedChange={handleChange} />
        </div>
      </LabelAndInput>
    );
  });

TrendlineAggregateAllCategories.displayName = 'TrendlineAggregateAllCategories';

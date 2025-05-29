import { Select, type SelectItem } from '@/components/ui/select';
import React from 'react';
import { LabelAndInput } from '../../Common';
import type { LoopTrendline } from './EditTrendline';

interface TrendlineLineStyleProps {
  trend: LoopTrendline;
  onUpdateExistingTrendline: (trend: LoopTrendline) => void;
}

export const TrendlineLineStyle: React.FC<TrendlineLineStyleProps> = React.memo(
  ({ trend, onUpdateExistingTrendline }) => {
    const lineStyles: SelectItem<'solid' | 'dotted' | 'dashed' | 'dashdot'>[] = [
      { value: 'solid', label: 'Solid' },
      { value: 'dotted', label: 'Dotted' },
      { value: 'dashed', label: 'Dashed' },
      { value: 'dashdot', label: 'Dash-Dot' }
    ];

    const handleChange = (value: 'solid' | 'dotted' | 'dashed' | 'dashdot') => {
      onUpdateExistingTrendline({
        ...trend,
        lineStyle: value
      });
    };

    return (
      <LabelAndInput label="Line Style">
        <Select
          className="w-full!"
          items={lineStyles}
          value={trend.lineStyle || 'solid'}
          onChange={handleChange}
        />
      </LabelAndInput>
    );
  }
);

TrendlineLineStyle.displayName = 'TrendlineLineStyle';

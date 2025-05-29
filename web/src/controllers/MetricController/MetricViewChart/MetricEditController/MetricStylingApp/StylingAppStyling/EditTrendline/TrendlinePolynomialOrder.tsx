import React, { useEffect, useState } from 'react';
import { SliderWithInputNumber } from '@/components/ui/slider';
import { LabelAndInput } from '../../Common';
import type { LoopTrendline } from './EditTrendline';

interface TrendlinePolynomialOrderProps {
  trend: LoopTrendline;
  onUpdateExistingTrendline: (trend: LoopTrendline) => void;
}

export const TrendlinePolynomialOrder: React.FC<TrendlinePolynomialOrderProps> = React.memo(
  ({ trend, onUpdateExistingTrendline }) => {
    const [value, setValue] = useState(trend.polynomialOrder ?? 2);

    useEffect(() => {
      if (trend.polynomialOrder !== value) {
        setValue(trend.polynomialOrder ?? 2);
      }
    }, [trend.polynomialOrder]);

    // Only show for polynomial regression type
    if (trend.type !== 'polynomial_regression') {
      return null;
    }

    const handleChange = (value: number) => {
      onUpdateExistingTrendline({
        ...trend,
        polynomialOrder: value
      });
    };

    return (
      <LabelAndInput label="Polynomial Order">
        <SliderWithInputNumber min={1} max={4} value={value} onChange={handleChange} />
      </LabelAndInput>
    );
  }
);

TrendlinePolynomialOrder.displayName = 'TrendlinePolynomialOrder';

import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { Input } from '@/components/ui/inputs';
import React, { useEffect, useRef } from 'react';
import { LabelAndInput } from '../../Common';

export const EditHeaderTitle: React.FC<{
  value: string | undefined;
  type: 'header' | 'subHeader';
  onUpdateChartConfig: (chartConfig: Partial<IBusterMetricChartConfig>) => void;
}> = React.memo(({ value, onUpdateChartConfig, type }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const key: keyof IBusterMetricChartConfig =
    type === 'header' ? 'metricHeader' : 'metricSubHeader';
  const title = type === 'header' ? 'Header' : 'Sub-header';
  const placeholder = type === 'header' ? 'Enter header' : 'Enter sub-header';

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateChartConfig({ [key]: e.target.value });
  };

  useEffect(() => {
    setTimeout(() => {
      if (!value) {
        inputRef.current?.focus();
      }
    }, 150);
  }, []);

  return (
    <LabelAndInput label={title}>
      <Input ref={inputRef} placeholder={placeholder} value={value} onChange={onChange} />
    </LabelAndInput>
  );
});

EditHeaderTitle.displayName = 'EditHeaderTitle';

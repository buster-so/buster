import React, { useEffect, useRef } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { Input } from '@/components/ui/inputs';
import { LabelAndInput } from '../../Common';

export const EditHeaderTitle: React.FC<{
  value: string | undefined;
  type: 'header' | 'subHeader';
  onUpdateChartConfig: (chartConfig: Partial<ChartConfigProps>) => void;
}> = React.memo(({ value, onUpdateChartConfig, type }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const key: keyof ChartConfigProps = type === 'header' ? 'metricHeader' : 'metricSubHeader';
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

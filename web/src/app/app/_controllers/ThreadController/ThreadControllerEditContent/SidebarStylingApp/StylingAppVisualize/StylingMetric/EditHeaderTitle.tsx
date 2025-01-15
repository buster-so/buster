import { IBusterThreadMessageChartConfig } from '@/api/buster-rest';
import React, { useRef } from 'react';
import { LabelAndInput } from '../../Common';
import { Input, InputRef } from 'antd';
import { useTimeout } from 'ahooks';

export const EditHeaderTitle: React.FC<{
  value: string | undefined;
  type: 'header' | 'subHeader';
  onUpdateChartConfig: (chartConfig: Partial<IBusterThreadMessageChartConfig>) => void;
}> = React.memo(
  ({ value, onUpdateChartConfig, type }) => {
    const inputRef = useRef<InputRef>(null);
    const key: keyof IBusterThreadMessageChartConfig =
      type === 'header' ? 'metricHeader' : 'metricSubHeader';
    const title = type === 'header' ? 'Header' : 'Sub-header';
    const placeholder = type === 'header' ? 'Enter header' : 'Enter sub-header';

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateChartConfig({ [key]: e.target.value });
    };

    useTimeout(() => {
      if (!value) {
        inputRef.current?.focus();
      }
    }, 150);

    return (
      <LabelAndInput label={title}>
        <Input ref={inputRef} placeholder={placeholder} defaultValue={value} onChange={onChange} />
      </LabelAndInput>
    );
  },
  () => true
);

EditHeaderTitle.displayName = 'EditHeaderTitle';

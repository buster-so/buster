import { IBusterThreadMessageChartConfig } from '@/api/buster-rest';
import { ChartEncodes, ScatterAxis } from '@/components/charts';
import { Slider } from 'antd';
import React from 'react';
import isEmpty from 'lodash/isEmpty';
import { useMemoizedFn } from 'ahooks';
import { LabelAndInput } from '../Common';

export const EditScatterDotSize: React.FC<{
  scatterDotSize: IBusterThreadMessageChartConfig['scatterDotSize'];
  scatterAxis: ScatterAxis;
  onUpdateChartConfig: (config: Partial<IBusterThreadMessageChartConfig>) => void;
}> = React.memo(
  ({ scatterDotSize, scatterAxis, onUpdateChartConfig }) => {
    const hasSize = !isEmpty(scatterAxis.size);
    const defaultValue = hasSize ? scatterDotSize : scatterDotSize[0];

    const onChange = useMemoizedFn((v: number[]) => {
      const newLower = v[0];
      const newUpper = hasSize ? v[1] : newLower + 18;
      const arrayFormat: [number, number] = [newLower, newUpper];
      onUpdateChartConfig({
        scatterDotSize: arrayFormat
      });
    });

    return (
      <LabelAndInput label="Dot size">
        <Slider
          min={1}
          max={50}
          step={1}
          range={{
            draggableTrack: hasSize
          }}
          defaultValue={defaultValue as number[]}
          onChange={onChange}
        />
      </LabelAndInput>
    );
  },
  () => true
);
EditScatterDotSize.displayName = 'EditScatterDotSize';

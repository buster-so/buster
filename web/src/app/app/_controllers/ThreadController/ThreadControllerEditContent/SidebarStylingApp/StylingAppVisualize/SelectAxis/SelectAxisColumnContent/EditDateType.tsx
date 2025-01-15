import React, { useMemo } from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { Select } from 'antd';
import { IColumnLabelFormat } from '@/components/charts/interfaces';
import { useMemoizedFn } from 'ahooks';
import last from 'lodash/last';
import first from 'lodash/first';
import { getDefaultQuarterOptions } from './dateConfig';
import { DEFAULT_DAY_OF_WEEK_FORMAT } from '@/api/buster-rest/threads/defaults';

const options: {
  label: string;
  value: IColumnLabelFormat['convertNumberTo'];
}[] = [
  { label: 'Day of Week', value: 'day_of_week' },
  { label: 'Month of Year', value: 'month_of_year' },
  { label: 'Quarter', value: 'quarter' },
  { label: 'Number', value: 'number' }
];

export const EditDateType: React.FC<{
  convertNumberTo: IColumnLabelFormat['convertNumberTo'];
  onUpdateColumnConfig: (columnLabelFormat: Partial<IColumnLabelFormat>) => void;
}> = React.memo(
  ({ convertNumberTo, onUpdateColumnConfig }) => {
    const selectedOption = useMemo(() => {
      return options.find((option) => option.value === convertNumberTo) || last(options);
    }, [convertNumberTo]);

    const onChange = useMemoizedFn(({ value }: (typeof options)[number]) => {
      if (value === 'day_of_week') {
        return onUpdateColumnConfig({
          dateFormat: DEFAULT_DAY_OF_WEEK_FORMAT,
          convertNumberTo: value as IColumnLabelFormat['convertNumberTo']
        });
      }
      if (value === 'month_of_year') {
        return onUpdateColumnConfig({
          dateFormat: 'MMMM',
          convertNumberTo: value as IColumnLabelFormat['convertNumberTo']
        });
      }
      if (value === 'quarter') {
        const defaultOptions = getDefaultQuarterOptions(new Date());
        return onUpdateColumnConfig({
          convertNumberTo: value as IColumnLabelFormat['convertNumberTo'],
          dateFormat: first(defaultOptions)?.value
        });
      }

      onUpdateColumnConfig({
        convertNumberTo: value as IColumnLabelFormat['convertNumberTo'],
        dateFormat: 'LLL'
      });
    });

    return (
      <LabelAndInput label="Type">
        <div className="w-full overflow-hidden">
          <Select
            className="!w-full"
            options={options}
            defaultValue={selectedOption}
            onChange={onChange}
            labelInValue
          />
        </div>
      </LabelAndInput>
    );
  },
  (prevProps, nextProps) => {
    return true;
  }
);
EditDateType.displayName = 'EditDateType';

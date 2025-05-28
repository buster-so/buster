import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import { Select, type SelectItem } from '@/components/ui/select';
import { useMemoizedFn } from '@/hooks';
import { formatDate, getNow } from '@/lib/date';
import first from 'lodash/last';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import {
  NO_FORMATTING_ITEM,
  getDefaultDateOptions,
  getDefaultDayOfWeekOptions,
  getDefaultMonthOptions,
  getDefaultQuarterOptions
} from './dateConfig';

export const EditDateFormat: React.FC<{
  dateFormat: IColumnLabelFormat['dateFormat'];
  convertNumberTo: IColumnLabelFormat['convertNumberTo'];
  columnType: IColumnLabelFormat['columnType'];
  onUpdateColumnConfig: (columnLabelFormat: Partial<IColumnLabelFormat>) => void;
}> = React.memo(({ dateFormat, columnType, convertNumberTo, onUpdateColumnConfig }) => {
  const now = useMemo(() => getNow().toDate(), []);

  const useAlternateFormats = useMemo(() => {
    return columnType === 'number' && convertNumberTo;
  }, [columnType, convertNumberTo]);

  const defaultOptions = useMemo(() => {
    if (useAlternateFormats === 'day_of_week') return getDefaultDayOfWeekOptions(now);
    if (useAlternateFormats === 'month_of_year') return getDefaultMonthOptions(now);
    if (useAlternateFormats === 'quarter') return getDefaultQuarterOptions(now);
    return getDefaultDateOptions(now);
  }, [useAlternateFormats]);

  const selectOptions: SelectItem[] = useMemo(() => {
    const dateFormatIsInDefaultOptions = defaultOptions.some(({ value }) => value === dateFormat);
    if (!dateFormat || dateFormatIsInDefaultOptions || useAlternateFormats) return defaultOptions;
    return [
      ...defaultOptions,
      {
        label: formatDate({
          date: now,
          format: dateFormat
        }),
        value: dateFormat
      }
    ].filter(({ value }) => value);
  }, [dateFormat, defaultOptions, useAlternateFormats]);

  const selectedOption = useMemo(() => {
    if (dateFormat === '') return NO_FORMATTING_ITEM;
    return selectOptions.find((option) => option.value === dateFormat) || first(selectOptions);
  }, [dateFormat, selectOptions]);

  const onChange = useMemoizedFn((value: IColumnLabelFormat['dateFormat']) => {
    if (value === NO_FORMATTING_ITEM.value) {
      onUpdateColumnConfig({
        dateFormat: ''
      });
    } else {
      onUpdateColumnConfig({
        dateFormat: value
      });
    }
  });

  return (
    <LabelAndInput label="Date format">
      <Select
        key={convertNumberTo}
        className="w-full!"
        items={selectOptions}
        value={selectedOption?.value}
        onChange={onChange}
      />
    </LabelAndInput>
  );
});
EditDateFormat.displayName = 'EditDateFormat';

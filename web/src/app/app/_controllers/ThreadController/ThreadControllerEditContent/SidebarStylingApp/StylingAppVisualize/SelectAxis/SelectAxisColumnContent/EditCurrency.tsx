import React, { useMemo } from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import type { IColumnLabelFormat } from '@/components/charts/interfaces/columnLabelInterfaces';
import { Select } from 'antd';
import { useGetCurrencies } from '@/api/buster-rest/nextjs/currency';
import { useMemoizedFn } from 'ahooks';
import { Text } from '@/components/text';

export const EditCurrency: React.FC<{
  currency: IColumnLabelFormat['currency'];
  onUpdateColumnConfig: (columnLabelFormat: Partial<IColumnLabelFormat>) => void;
}> = React.memo(
  ({ currency, onUpdateColumnConfig }) => {
    const { data: currencies, isFetched } = useGetCurrencies({ enabled: true });

    const options = useMemo(() => {
      return (
        currencies?.map((currency) => ({
          label: (
            <div className="flex items-center gap-1.5 overflow-hidden">
              <div className="rounded">{currency.flag}</div>
              <Text className="truncate">{currency.description}</Text>
            </div>
          ),
          value: currency.code,
          description: currency.description
        })) || []
      );
    }, [currencies]);

    const selectedCurrency = useMemo(() => {
      return options?.find((option) => option.value === currency);
    }, [options, currency]);

    const onFilterOption = useMemoizedFn((input: string, option: any) => {
      const _option = option as (typeof options)[0];
      return (
        !!_option?.description?.toLowerCase().includes(input.toLowerCase()) ||
        !!_option?.value?.toLowerCase().includes(input.toLowerCase())
      );
    });

    const onChange = useMemoizedFn((option: (typeof options)[0]) => {
      const value = option.value;
      onUpdateColumnConfig({ currency: value });
    });

    return (
      <LabelAndInput label="Currency">
        <div className="w-full overflow-hidden">
          <Select
            key={isFetched ? 'fetched' : 'not-fetched'}
            loading={!isFetched}
            options={options}
            disabled={!isFetched}
            onChange={onChange}
            defaultValue={selectedCurrency}
            className="!w-full"
            popupMatchSelectWidth={false}
            showSearch
            labelInValue
            filterOption={onFilterOption}
          />
        </div>
      </LabelAndInput>
    );
  },
  () => {
    return true;
  }
);
EditCurrency.displayName = 'EditCurrency';

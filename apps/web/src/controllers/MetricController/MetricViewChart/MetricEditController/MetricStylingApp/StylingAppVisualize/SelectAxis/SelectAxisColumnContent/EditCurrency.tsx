import React, { useMemo } from 'react';
import type { ColumnLabelFormat } from '@buster/server-shared/metrics';
import { useGetCurrencies } from '@/api/buster_rest/dictionaries';
import { Select, type SelectItem } from '@/components/ui/select';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { LabelAndInput } from '../../../Common/LabelAndInput';

export const EditCurrency: React.FC<{
  currency: ColumnLabelFormat['currency'];
  onUpdateColumnConfig: (columnLabelFormat: Partial<ColumnLabelFormat>) => void;
}> = React.memo(({ currency, onUpdateColumnConfig }) => {
  const { data: currencies, isFetched } = useGetCurrencies();

  const options: SelectItem[] = useMemo(() => {
    return (
      currencies?.map<SelectItem<string>>((currency) => ({
        label: (
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="rounded-sm">{currency.flag}</div>
            <Text className="truncate">
              {currency.description} ({currency.code})
            </Text>
          </div>
        ),
        value: currency.code,
        searchLabel: `${currency.code} ${currency.description}`
      })) || []
    );
  }, [currencies]);

  const selectedCurrency = useMemo(() => {
    return options?.find((option) => option.value === currency);
  }, [options, currency]);

  const onChange = useMemoizedFn((optionValue: string) => {
    const value = optionValue;
    onUpdateColumnConfig({ currency: value });
  });

  return (
    <LabelAndInput label="Currency">
      <div className="w-full overflow-hidden">
        <Select
          key={isFetched ? 'fetched' : 'not-fetched'}
          items={options}
          disabled={!isFetched}
          onChange={onChange}
          value={selectedCurrency?.value}
          className="w-full!"
        />
      </div>
    </LabelAndInput>
  );
});
EditCurrency.displayName = 'EditCurrency';

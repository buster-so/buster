import { queryKeys } from '@/api/query_keys';
import { useQuery } from '@tanstack/react-query';
import { mainApiV2 } from '../instances';
import { Currency } from '@buster/server-shared/currency';

export const useGetCurrencies = () => {
  return useQuery({
    ...queryKeys.getCurrencies,
    queryFn: async () => {
      return mainApiV2.get<Currency[]>('/api/currency').then(async (res) => res.data);
    }
  });
};

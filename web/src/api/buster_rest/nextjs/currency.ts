import { useCreateReactQuery } from '../../createReactQuery';

enum QUERY_REQUEST_KEYS {
  getCurrencies = 'getCurrencies'
}

export const useGetCurrencies = ({ enabled }: { enabled: boolean }) => {
  return useCreateReactQuery({
    queryKey: [QUERY_REQUEST_KEYS.getCurrencies],
    queryFn: () =>
      fetch('/api/currency').then(
        async (res) => (await res.json()) as { code: string; description: string; flag: string }[]
      ),
    refetchOnWindowFocus: false,
    enabled,
    refetchOnMount: false
  });
};

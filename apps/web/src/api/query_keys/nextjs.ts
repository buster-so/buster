import { queryOptions } from '@tanstack/react-query';

export const getCurrencies = queryOptions<{ code: string; description: string; flag: string }[]>({
  queryKey: ['nextjs', 'list', 'currencies'],
  initialData: [],
  initialDataUpdatedAt: 0,
  staleTime: 1000 * 60 * 60 * 24 * 7 //7 days
});

export const nextjsQueryKeys = {
  getCurrencies
};

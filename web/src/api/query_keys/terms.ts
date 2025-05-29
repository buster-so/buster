import { queryOptions } from '@tanstack/react-query';
import type { BusterTerm, BusterTermListItem } from '@/api/asset_interfaces/terms';

export const termsGetList = queryOptions<BusterTermListItem[]>({
  queryKey: ['terms', 'list'] as const,
  staleTime: 10 * 1000,
  initialData: [],
  initialDataUpdatedAt: 0
});

export const termsGetTerm = (termId: string) =>
  queryOptions<BusterTerm>({
    queryKey: ['terms', 'get', termId] as const,
    staleTime: 10 * 1000
  });

export const termsQueryKeys = {
  termsGetList,
  termsGetTerm
};

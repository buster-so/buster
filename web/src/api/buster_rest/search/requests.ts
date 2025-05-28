import { mainApi } from '../instances';
import type { BusterSearchResult } from '@/api/asset_interfaces/search';

export const search = async (params: {
  query: string;
  asset_types: ('dashboard' | 'metric' | 'collection')[];
  num_results?: number;
}) => {
  return mainApi.post<BusterSearchResult[]>('/search', params).then((res) => res.data);
};

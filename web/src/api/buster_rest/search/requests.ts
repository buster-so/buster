import type { BusterSearchResult } from '@/api/asset_interfaces/search';
import { mainApi } from '../instances';

export const search = async (params: {
  query: string;
  asset_types: ('dashboard' | 'metric' | 'collection')[];
  num_results?: number;
}) => {
  return mainApi.post<BusterSearchResult[]>('/search', params).then((res) => res.data);
};

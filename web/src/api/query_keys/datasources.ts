import { queryOptions } from '@tanstack/react-query';
import type { DataSource, DataSourceListItem } from '@/api/asset_interfaces/datasources';

export const datasourceGetList = queryOptions<DataSourceListItem[]>({
  queryKey: ['datasources', 'list'] as const,
  staleTime: 30 * 1000, // 30 seconds,
  initialData: [],
  initialDataUpdatedAt: 0
});

export const datasourceGet = (id: string) =>
  queryOptions<DataSource>({
    queryKey: ['datasources', 'get', id] as const,
    staleTime: 10 * 1000 // 10 seconds
  });

export const datasourceQueryKeys = {
  datasourceGetList,
  datasourceGet
};

import { BusterSearchRequest } from '@/api/buster_socket/search';

export const allBusterSearchRequestKeys = [
  // 'query',
  //  'num_results',
  'exclude_threads',
  'exclude_collections',
  'exclude_dashboards',
  'exclude_data_sources',
  'exclude_datasets',
  'exclude_permission_groups',
  'exclude_teams',
  'exclude_terms'
] as (keyof BusterSearchRequest['payload'])[];

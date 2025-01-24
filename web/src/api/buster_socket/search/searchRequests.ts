import { BusterSocketRequestBase } from '../baseInterfaces';

export type BusterSearchRequest = BusterSocketRequestBase<
  '/search',
  {
    query: string;
    num_results?: null | number; //optional: default is 15
    exclude_threads?: null | boolean; //optional: all of these excludes default to false.  If you pass up true, it will remove them from the results.
    exclude_collections?: null | boolean;
    exclude_dashboards?: null | boolean;
    exclude_data_sources?: null | boolean;
    exclude_datasets?: null | boolean;
    exclude_permission_groups?: null | boolean;
    exclude_teams?: null | boolean;
    exclude_terms?: null | boolean;
  }
>;

export type BusterSearchEmits = BusterSearchRequest;

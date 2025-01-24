import { BusterSocketRequestBase } from '../baseInterfaces';

export type DatasetListEmitPayload = BusterSocketRequestBase<
  '/datasets/list',
  {
    page: number;
    page_size: number;
    admin_view: boolean;
    enabled?: boolean;
    imported?: boolean;
    permission_group_id?: string;
    belongs_to?: boolean | null;
  }
>;

export type DatasetGetEmit = BusterSocketRequestBase<
  '/datasets/get',
  {
    id: string;
  }
>;

export type DatasetPostEmit = BusterSocketRequestBase<
  '/datasets/post',
  {
    name?: string;
    data_source_id: string;
    dataset_id?: string;
  }
>;

export type DatasetDeleteEmit = BusterSocketRequestBase<
  '/datasets/delete',
  {
    ids: string[];
  }
>;

export type DatasetUpdateEmit = BusterSocketRequestBase<
  '/datasets/update',
  {
    id: string;
    enabled?: boolean;
    when_to_use?: string;
    when_not_to_use?: string;
    name?: string;
    dataset_definition?: {
      sql: string;
      schema: string;
      identifier: string;
      type: 'view' | 'materializedView';
    };
    data_source_id?: string;
  }
>;

export type DatasetUpdateColumnEmit = BusterSocketRequestBase<
  '/datasets/column/update',
  {
    id: string;
    description?: string;
    stored_values?: boolean;
  }
>;

export type DatasetEmits =
  | DatasetListEmitPayload
  | DatasetGetEmit
  | DatasetPostEmit
  | DatasetDeleteEmit
  | DatasetUpdateEmit
  | DatasetUpdateColumnEmit;

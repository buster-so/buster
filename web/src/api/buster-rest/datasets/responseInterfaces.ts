import { DataSource, DataSourceTypes } from '../datasources';

export interface BusterDatasetListItem {
  id: string;
  name: string;
  data_source?: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
  definition: string;
  deleted_at: null | string;
  enabled: boolean;
  imported: boolean;
  owner: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  database_name: string;
  belongs_to: string | null;
}

export type BusterDataset = {
  description: string;
  id: string;
  name: string;
  sql: string;
  yml_file: string;
  data_source_id: string;
  data_source_name: string;
  data_source_type: DataSourceTypes;
};

export interface BusterDatasetColumn {
  id: string;
  name: string;
  type: string;
  stored_values: boolean;
  created_at: string;
  dataset_id: string;
  description: string | null;
  deleted_at: string | null;
  nullable: boolean;
  updated_at: string;
}

export type BusterDatasetData = Record<string, string | number | null>[];

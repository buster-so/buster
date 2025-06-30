import type { BusterShare, VerificationStatus } from '../share';
import type { BusterChartConfigProps } from './charts';
import { z } from 'zod/v4-mini';

export type BusterMetric = {
  id: string;
  type: 'metric';
  name: string;
  version_number: number;
  description: string | null;
  file_name: string;
  time_frame: string;
  dataset_id: string;
  data_source_id: string;
  dataset_name: string | null;
  error: string | null;
  chart_config?: BusterChartConfigProps;
  data_metadata: DataMetadata;
  status: VerificationStatus;
  evaluation_score: 'Moderate' | 'High' | 'Low';
  evaluation_summary: string;
  file: string; //yaml file
  created_at: string;
  updated_at: string;
  sent_by_id: string;
  sent_by_name: string;
  sent_by_avatar_url: string | null;
  sql: string | null;
  dashboards: {
    id: string;
    name: string;
  }[];
  collections: {
    id: string;
    name: string;
  }[];
  versions: {
    version_number: number;
    updated_at: string;
  }[];
} & BusterShare;

export type DataMetadata = {
  column_count: number;
  column_metadata: ColumnMetaData[];
  row_count: number;
} | null;

export type ColumnMetaData = {
  name: string;
  min_value: number | string;
  max_value: number | string;
  unique_values: number;
  simple_type: 'text' | 'number' | 'date';
  type:
    | 'text'
    | 'float'
    | 'integer'
    | 'date'
    | 'float8'
    | 'timestamp'
    | 'timestamptz'
    | 'bool'
    | 'date'
    | 'time'
    | 'boolean'
    | 'json'
    | 'jsonb'
    | 'int8'
    | 'int4'
    | 'int2'
    | 'decimal'
    | 'char'
    | 'character varying'
    | 'character'
    | 'varchar'
    | 'text'
    | 'number'
    | 'numeric'
    | 'tinytext'
    | 'mediumtext'
    | 'longtext'
    | 'nchar'
    | 'nvarchat'
    | 'ntext'
    | 'float4';
};

export type IDataResult = Record<string, null | string | number>[] | null;

import { BusterThreadMessageConfig } from './threadConfigInterfaces';
import { ShareRole } from '@/api/buster-socket/threads';

export type BusterThreadListItem = {
  id: string;
  title: string;
  last_edited: string;
  dataset_name: string;
  dataset_uuid: string;
  created_by_id: string;
  created_by_name: string;
  created_by_email: string;
  created_by_avatar: string;
  status: BusterVerificationStatus;
  is_shared: boolean;
};

export enum BusterVerificationStatus {
  notRequested = 'notRequested',
  requested = 'requested',
  inReview = 'inReview',
  verified = 'verified',
  backlogged = 'backlogged',
  notVerified = 'notVerified'
}

export type BusterThread = {
  created_at: string;
  created_by: string;
  dashboard_id: string | null;
  deleted_at: null;
  folder_id: null;
  id: string;
  messages: BusterThreadMessage[];
  updated_at: null;
  updated_by: string;
  title: string;
  dashboards: {
    id: string;
    name: string;
  }[];
  collections: {
    id: string;
    name: string;
  }[];
  dataset_id: string | null;
  dataset_name: string | null;
  state_message_id: string | null;
} & BusterShare;

export type BusterThoughtCode = {
  code: string;
  title: string;
  error: string;
  description: string;
  type: 'codeBlock';
};

export type BusterThoughtText = {
  content: string;
  title: string;
  type: 'thoughtBlock';
};

export type BusterThought = BusterThoughtCode | BusterThoughtText;

export type BusterThreadMessage = {
  chart_recommendations: {} | null; // Nullable
  code: string | null; // Nullable
  created_at: string;
  dataset_id: string | null; // Nullable
  dataset_name: string | null;
  deleted_at: string | null; // Nullable
  feedback: 'positive' | 'negative' | null; // Nullable
  error: string | null;
  id: string;
  message: string;
  response: string;
  sent_by: string;
  sent_by_name: string;
  thread_id: string;
  time_frame: string | null; // Nullable
  title: string | null; // Nullable
  updated_at: string | null; // Nullable
  chart_config?: BusterThreadMessageConfig;
  description: string | null; // Nullable
  status: BusterThreadListItem['status'];

  thoughts: {
    title: string;
    thoughts: BusterThought[];
  };
  data_metadata: {
    column_count: number;
    column_metadata: ColumnMetaData[];
    row_count: number;
  } | null;
  draft_session_id: string | null;
} & BusterThreadMessageSqlEvaluation;

export type BusterThreadMessageSqlEvaluation = {
  evaluation_summary: string;
  evaluation_score: 'Moderate' | 'High' | 'Low';
};

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

export type ColumnDataType = ColumnMetaData['type'];

export type BusterThreadUser = {
  email: string;
  id: string;
  name: string;
  thread_id: string;
};

export enum BusterThreadStepProgress {
  inProgress = 'inProgress',
  completed = 'completed'
}

export interface BusterShare {
  sharingKey: string;
  individual_permissions: null | BusterShareIndividual[];
  team_permissions: null | { name: string; id: string; role: ShareRole }[];
  organization_permissions: null | [];
  password_secret_id: string | null;
  public_expiry_date: string | null;
  public_enabled_by: string | null;
  publicly_accessible: boolean;
  public_password: string | null;
  permission: ShareRole; //this is the permission the user has to the thread, dashboard or collection
}

export interface BusterShareIndividual {
  email: string;
  role: ShareRole;
  id: string;
  name: string;
}

export interface BusterThreadSearchItem {
  id: string;
  title: string;
}

// Type definitions for database enums

export type AssetType =
  | 'dashboard'
  | 'thread'
  | 'chat'
  | 'metric_file'
  | 'dashboard_file'
  | 'collection'
  | 'data_source'
  | 'metric'
  | 'filter'
  | 'dataset'
  | 'tool'
  | 'source'
  | 'collection_file'
  | 'dataset_permission';

export type AssetPermissionRole =
  | 'owner'
  | 'viewer'
  | 'can_view'
  | 'can_filter'
  | 'can_edit'
  | 'full_access';

export type IdentityType = 'user' | 'team' | 'organization';

export type WorkspaceSharing = 'none' | 'can_view' | 'can_edit' | 'full_access';

export type UserOrganizationRole =
  | 'workspace_admin'
  | 'data_admin'
  | 'querier'
  | 'restricted_querier'
  | 'viewer';

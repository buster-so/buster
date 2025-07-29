import type { AssetType } from './asset-permissions';

// Internal types for cascading permissions

// Cascading permission check types
export type CascadingCheckType =
  | 'metric_through_dashboard'
  | 'metric_through_chat'
  | 'metric_through_collection'
  | 'dashboard_through_chat'
  | 'dashboard_through_collection'
  | 'chat_through_collection';

// How the user has access to the containing asset
export type CascadingAccessMethod = 'direct' | 'workspace_sharing' | 'public' | 'collection';

// Cascading access result
export interface CascadingAccessResult {
  hasAccess: boolean;
  accessPath?: {
    type: CascadingCheckType;
    containingAsset: {
      id: string;
      type: AssetType;
      name?: string;
    };
    accessMethod: CascadingAccessMethod;
  };
}

// Helper type for cascading permission rules
export interface CascadingRule {
  sourceType: AssetType;
  targetType: AssetType;
  checkType: CascadingCheckType;
  description: string;
}

// Define cascading permission rules
export const cascadingRules: CascadingRule[] = [
  {
    sourceType: 'metric_file',
    targetType: 'dashboard_file',
    checkType: 'metric_through_dashboard',
    description: 'Metrics inherit view permissions from dashboards they appear in',
  },
  {
    sourceType: 'metric_file',
    targetType: 'chat',
    checkType: 'metric_through_chat',
    description: 'Metrics inherit view permissions from chats they appear in',
  },
  {
    sourceType: 'metric_file',
    targetType: 'collection',
    checkType: 'metric_through_collection',
    description: 'Metrics inherit view permissions from collections they appear in',
  },
  {
    sourceType: 'dashboard_file',
    targetType: 'chat',
    checkType: 'dashboard_through_chat',
    description: 'Dashboards inherit view permissions from chats they appear in',
  },
  {
    sourceType: 'dashboard_file',
    targetType: 'collection',
    checkType: 'dashboard_through_collection',
    description: 'Dashboards inherit view permissions from collections they appear in',
  },
  {
    sourceType: 'chat',
    targetType: 'collection',
    checkType: 'chat_through_collection',
    description: 'Chats inherit view permissions from collections they appear in',
  },
];

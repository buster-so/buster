import { isNull, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  AssetPermissionRoleSchema,
  AssetTypeSchema,
  ChatTypeSchema,
  type DashboardYml,
  DataSourceOnboardingStatusSchema,
  DatasetTypeSchema,
  DocsTypeSchema,
  GithubIntegrationStatusSchema,
  IdentityTypeSchema,
  MessageAnalysisModeSchema,
  MessageFeedbackSchema,
  type MessageMetadata,
  type OrganizationColorPalettes,
  SharingSettingSchema,
  SlackChatAuthorizationSchema,
  SlackIntegrationStatusSchema,
  SlackSharingPermissionSchema,
  StorageProviderSchema,
  StoredValuesStatusSchema,
  TableTypeSchema,
  TeamRoleSchema,
  UserOrganizationRoleSchema,
  UserOrganizationStatusSchema,
  type UserPersonalizationConfigType,
  type UserShortcutTrackingType,
  type UserSuggestedPromptsType,
  VerificationSchema,
  WorkspaceSharingSchema,
} from './schema-types';
import type { DatasetMetadata } from './schema-types/dataset-metadata';

export const assetPermissionRoleEnum = pgEnum(
  'asset_permission_role_enum',
  AssetPermissionRoleSchema.options
);
export const assetTypeEnum = pgEnum('asset_type_enum', AssetTypeSchema.options);
// Asset type enum removed - now using text for all asset_type columns
export const dataSourceOnboardingStatusEnum = pgEnum(
  'data_source_onboarding_status_enum',
  DataSourceOnboardingStatusSchema.options
);
export const datasetTypeEnum = pgEnum('dataset_type_enum', DatasetTypeSchema.options);
export const identityTypeEnum = pgEnum('identity_type_enum', IdentityTypeSchema.options);
export const messageFeedbackEnum = pgEnum('message_feedback_enum', MessageFeedbackSchema.options);
export const sharingSettingEnum = pgEnum('sharing_setting_enum', SharingSettingSchema.options);
export const storedValuesStatusEnum = pgEnum(
  'stored_values_status_enum',
  StoredValuesStatusSchema.options
);
export const teamRoleEnum = pgEnum('team_role_enum', TeamRoleSchema.options);
export const userOrganizationRoleEnum = pgEnum(
  'user_organization_role_enum',
  UserOrganizationRoleSchema.options
);
export const userOrganizationStatusEnum = pgEnum(
  'user_organization_status_enum',
  UserOrganizationStatusSchema.options
);
export const verificationEnum = pgEnum('verification_enum', VerificationSchema.options);
export const storageProviderEnum = pgEnum('storage_provider_enum', StorageProviderSchema.options);
export const tableTypeEnum = pgEnum('table_type_enum', TableTypeSchema.options);
export const slackIntegrationStatusEnum = pgEnum(
  'slack_integration_status_enum',
  SlackIntegrationStatusSchema.options
);

export const slackChatAuthorizationEnum = pgEnum(
  'slack_chat_authorization_enum',
  SlackChatAuthorizationSchema.options
);

export const slackSharingPermissionEnum = pgEnum(
  'slack_sharing_permission_enum',
  SlackSharingPermissionSchema.options
);

export const githubIntegrationStatusEnum = pgEnum(
  'github_integration_status_enum',
  GithubIntegrationStatusSchema.options
);

export const workspaceSharingEnum = pgEnum(
  'workspace_sharing_enum',
  WorkspaceSharingSchema.options
);

export const docsTypeEnum = pgEnum('docs_type_enum', DocsTypeSchema.options);

export const messageAnalysisModeEnum = pgEnum(
  'message_analysis_mode_enum',
  MessageAnalysisModeSchema.options
);

export const chatTypeEnum = pgEnum('chat_type_enum', ChatTypeSchema.options);

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    ownerId: uuid('owner_id').notNull(),
    key: text().notNull(),
    organizationId: uuid('organization_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'api_keys_organization_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.ownerId],
      foreignColumns: [users.id],
      name: 'api_keys_owner_id_fkey',
    }).onUpdate('cascade'),
    unique('api_keys_key_key').on(table.key),
  ]
);

export const teams = pgTable(
  'teams',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    organizationId: uuid('organization_id').notNull(),
    sharingSetting: sharingSettingEnum('sharing_setting').default('none').notNull(),
    editSql: boolean('edit_sql').default(false).notNull(),
    uploadCsv: boolean('upload_csv').default(false).notNull(),
    exportAssets: boolean('export_assets').default(false).notNull(),
    emailSlackEnabled: boolean('email_slack_enabled').default(false).notNull(),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'teams_organization_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'teams_created_by_fkey',
    }).onUpdate('cascade'),
    unique('teams_name_key').on(table.name),
  ]
);

export const permissionGroups = pgTable(
  'permission_groups',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    organizationId: uuid('organization_id').notNull(),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'permission_groups_organization_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'permission_groups_created_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [users.id],
      name: 'permission_groups_updated_by_fkey',
    }).onUpdate('cascade'),
  ]
);

export const collections = pgTable(
  'collections',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    description: text(),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    organizationId: uuid('organization_id').notNull(),
    workspaceSharing: workspaceSharingEnum('workspace_sharing').default('none').notNull(),
    workspaceSharingEnabledBy: uuid('workspace_sharing_enabled_by'),
    workspaceSharingEnabledAt: timestamp('workspace_sharing_enabled_at', {
      withTimezone: true,
      mode: 'string',
    }),
    screenshotBucketKey: text('screenshot_bucket_key'),
    screenshotTakenAt: timestamp('screenshot_taken_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'collections_organization_id_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'collections_created_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [users.id],
      name: 'collections_updated_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.workspaceSharingEnabledBy],
      foreignColumns: [users.id],
      name: 'collections_workspace_sharing_enabled_by_fkey',
    }).onUpdate('cascade'),
  ]
);

export const dataSources = pgTable(
  'data_sources',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    type: text().notNull(),
    secretId: uuid('secret_id').notNull(),
    onboardingStatus: dataSourceOnboardingStatusEnum('onboarding_status')
      .default('notStarted')
      .notNull(),
    onboardingError: text('onboarding_error'),
    organizationId: uuid('organization_id').notNull(),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    env: varchar().default('dev').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'data_sources_organization_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'data_sources_created_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [users.id],
      name: 'data_sources_updated_by_fkey',
    }).onUpdate('cascade'),
    unique('data_sources_name_organization_id_env_key').on(
      table.name,
      table.organizationId,
      table.env
    ),
  ]
);

export const assetSearch = pgTable(
  'asset_search',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    assetId: uuid('asset_id').notNull(),
    // The assetType column is a plain string (text), not an enum.
    assetType: text('asset_type').notNull(),
    content: text().notNull(),
    organizationId: uuid('organization_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    uniqueIndex('asset_search_asset_id_asset_type_idx').using(
      'btree',
      table.assetId.asc().nullsLast().op('text_ops'),
      table.assetType.asc().nullsLast().op('text_ops')
    ),
    index('pgroonga_content_index').using(
      'pgroonga',
      table.content.asc().nullsLast().op('pgroonga_text_full_text_search_ops_v2')
    ),
  ]
);

export const datasetGroups = pgTable(
  'dataset_groups',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    organizationId: uuid('organization_id').notNull(),
    name: varchar().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index('dataset_groups_deleted_at_idx').using(
      'btree',
      table.deletedAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('dataset_groups_organization_id_idx').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'dataset_groups_organization_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('dataset_groups_policy', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
    }),
  ]
);

export const datasetPermissions = pgTable(
  'dataset_permissions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    organizationId: uuid('organization_id').notNull(),
    datasetId: uuid('dataset_id').notNull(),
    permissionId: uuid('permission_id').notNull(),
    permissionType: varchar('permission_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index('dataset_permissions_dataset_id_idx').using(
      'btree',
      table.datasetId.asc().nullsLast().op('uuid_ops')
    ),
    index('dataset_permissions_deleted_at_idx').using(
      'btree',
      table.deletedAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('dataset_permissions_organization_id_idx').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    ),
    index('dataset_permissions_permission_lookup_idx').using(
      'btree',
      table.permissionId.asc().nullsLast().op('uuid_ops'),
      table.permissionType.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'dataset_permissions_organization_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.datasetId],
      foreignColumns: [datasets.id],
      name: 'dataset_permissions_dataset_id_fkey',
    }).onDelete('cascade'),
    unique('dataset_permissions_dataset_id_permission_id_permission_typ_key').on(
      table.datasetId,
      table.permissionId,
      table.permissionType
    ),
    pgPolicy('dataset_permissions_policy', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
    }),
    check(
      'dataset_permissions_permission_type_check',
      sql`(permission_type)::text = ANY ((ARRAY['user'::character varying, 'dataset_group'::character varying, 'permission_group'::character varying])::text[])`
    ),
  ]
);

export const datasetGroupsPermissions = pgTable(
  'dataset_groups_permissions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    datasetGroupId: uuid('dataset_group_id').notNull(),
    permissionId: uuid('permission_id').notNull(),
    permissionType: varchar('permission_type').notNull(),
    organizationId: uuid('organization_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index('dataset_groups_permissions_dataset_group_id_idx').using(
      'btree',
      table.datasetGroupId.asc().nullsLast().op('uuid_ops')
    ),
    index('dataset_groups_permissions_organization_id_idx').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    ),
    index('dataset_groups_permissions_permission_id_idx').using(
      'btree',
      table.permissionId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.datasetGroupId],
      foreignColumns: [datasetGroups.id],
      name: 'dataset_groups_permissions_dataset_group_id_fkey',
    }),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'dataset_groups_permissions_organization_id_fkey',
    }),
    unique('unique_dataset_group_permission').on(
      table.datasetGroupId,
      table.permissionId,
      table.permissionType
    ),
  ]
);
export const datasets = pgTable(
  'datasets',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    databaseName: text('database_name').notNull(),
    whenToUse: text('when_to_use'),
    whenNotToUse: text('when_not_to_use'),
    type: datasetTypeEnum().notNull(),
    definition: text().notNull(),
    schema: text().notNull(),
    enabled: boolean().default(false).notNull(),
    imported: boolean().default(false).notNull(),
    dataSourceId: uuid('data_source_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    model: text(),
    ymlFile: text('yml_file'),
    databaseIdentifier: text('database_identifier'),
    metadata: jsonb()
      .$type<DatasetMetadata>()
      .default(sql`'{
      "rowCount": 0,
      "sampleSize": 0,
      "samplingMethod": "none",
      "columnProfiles": [],
      "introspectedAt": "2024-01-01T00:00:00.000Z"
    }'::jsonb`),
  },
  (table) => [
    foreignKey({
      columns: [table.dataSourceId],
      foreignColumns: [dataSources.id],
      name: 'datasets_data_source_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'datasets_organization_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'datasets_created_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [users.id],
      name: 'datasets_updated_by_fkey',
    }).onUpdate('cascade'),
    unique('datasets_name_schema_database_identifier_data_source_id_key').on(
      table.name,
      table.schema,
      table.databaseIdentifier,
      table.dataSourceId
    ),
  ]
);

export const users = pgTable(
  'users',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    email: text().notNull(),
    name: text(),
    config: jsonb().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    attributes: jsonb().default({}).notNull(),
    avatarUrl: text('avatar_url'),
    suggestedPrompts: jsonb('suggested_prompts')
      .$type<UserSuggestedPromptsType>()
      .default(sql`'{
        "suggestedPrompts": {
          "report": [
            "provide a trend analysis of quarterly profits",
            "evaluate product performance across regions"
          ],
          "dashboard": [
            "create a sales performance dashboard",
            "design a revenue forecast dashboard"
          ],
          "visualization": [
            "create a metric for monthly sales",
            "show top vendors by purchase volume"
          ],
          "help": [
            "what types of analyses can you perform?",
            "what questions can I ask buster?",
            "what data models are available for queries?",
            "can you explain your forecasting capabilities?"
          ]
        },
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }'::jsonb`)
      .notNull(),
    personalizationEnabled: boolean('personalization_enabled').default(false).notNull(),
    personalizationConfig: jsonb('personalization_config')
      .$type<UserPersonalizationConfigType>()
      .default({})
      .notNull(),
    lastUsedShortcuts: jsonb('last_used_shortcuts').$type<string[]>().default([]).notNull(),
  },
  (table) => [unique('users_email_key').on(table.email)]
);

export const messages = pgTable(
  'messages',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    requestMessage: text('request_message'),
    responseMessages: jsonb('response_messages').default([]).notNull(),
    messageAnalysisMode: messageAnalysisModeEnum('message_analysis_mode').default('auto').notNull(),
    reasoning: jsonb().default([]).notNull(),
    title: text().notNull(),
    rawLlmMessages: jsonb('raw_llm_messages').default([]).notNull(),
    finalReasoningMessage: text('final_reasoning_message'),
    chatId: uuid('chat_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    createdBy: uuid('created_by').notNull(),
    feedback: text(),
    isCompleted: boolean('is_completed').default(false).notNull(),
    postProcessingMessage: jsonb('post_processing_message'),
    triggerRunId: text('trigger_run_id'),
    metadata: jsonb().$type<MessageMetadata>().default({}).notNull(),
    errorReason: text('error_reason'),
  },
  (table) => [
    index('messages_chat_id_idx').using('btree', table.chatId.asc().nullsLast().op('uuid_ops')),
    index('messages_created_at_idx').using(
      'btree',
      table.createdAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('messages_created_by_idx').using(
      'btree',
      table.createdBy.asc().nullsLast().op('uuid_ops')
    ),
    index('messages_deleted_at_idx').using(
      'btree',
      table.deletedAt.asc().nullsLast().op('timestamptz_ops')
    ),
    // GIN indexes for JSONB columns
    index('messages_raw_llm_messages_gin_idx').using(
      'gin',
      table.rawLlmMessages.asc().nullsLast().op('jsonb_ops')
    ),
    index('messages_response_messages_gin_idx').using(
      'gin',
      table.responseMessages.asc().nullsLast().op('jsonb_ops')
    ),
    index('messages_reasoning_gin_idx').using(
      'gin',
      table.reasoning.asc().nullsLast().op('jsonb_ops')
    ),
    // Composite index for WHERE clause
    index('messages_id_deleted_at_idx').using(
      'btree',
      table.id.asc().nullsLast().op('uuid_ops'),
      table.deletedAt.asc().nullsLast().op('timestamptz_ops')
    ),
    foreignKey({
      columns: [table.chatId],
      foreignColumns: [chats.id],
      name: 'messages_chat_id_fkey',
    }),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'messages_created_by_fkey',
    }).onUpdate('cascade'),
  ]
);

export const messagesToFiles = pgTable(
  'messages_to_files',
  {
    id: uuid().primaryKey().notNull(),
    messageId: uuid('message_id').notNull(),
    fileId: uuid('file_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    isDuplicate: boolean('is_duplicate').default(false).notNull(),
    versionNumber: integer('version_number').default(1).notNull(),
  },
  (table) => [
    index('messages_files_file_id_idx').using(
      'btree',
      table.fileId.asc().nullsLast().op('uuid_ops')
    ),
    index('messages_files_message_id_idx').using(
      'btree',
      table.messageId.asc().nullsLast().op('uuid_ops')
    ),
    // Performance indexes for active messages to files
    index('idx_mtf_active_by_file')
      .on(table.messageId)
      .where(isNull(table.deletedAt)),
    foreignKey({
      columns: [table.messageId],
      foreignColumns: [messages.id],
      name: 'messages_to_files_message_id_fkey',
    }),
    unique('messages_to_files_message_id_file_id_key').on(table.messageId, table.fileId),
  ]
);

export const dashboardFiles = pgTable(
  'dashboard_files',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: varchar().notNull(),
    fileName: varchar('file_name').notNull(),
    content: jsonb().$type<DashboardYml>().notNull(),
    filter: varchar(),
    organizationId: uuid('organization_id').notNull(),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    publiclyAccessible: boolean('publicly_accessible').default(false).notNull(),
    publiclyEnabledBy: uuid('publicly_enabled_by'),
    publicExpiryDate: timestamp('public_expiry_date', {
      withTimezone: true,
      mode: 'string',
    }),
    versionHistory: jsonb('version_history')
      .$type<
        Record<
          string, //version number as a string
          {
            content: Record<string, unknown>;
            updated_at: string;
            version_number: number;
          }
        >
      >()
      .default({})
      .notNull(),
    publicPassword: text('public_password'),
    workspaceSharing: workspaceSharingEnum('workspace_sharing').default('none').notNull(),
    workspaceSharingEnabledBy: uuid('workspace_sharing_enabled_by'),
    workspaceSharingEnabledAt: timestamp('workspace_sharing_enabled_at', {
      withTimezone: true,
      mode: 'string',
    }),
    screenshotBucketKey: text('screenshot_bucket_key'),
    screenshotTakenAt: timestamp('screenshot_taken_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index('dashboard_files_created_by_idx').using(
      'btree',
      table.createdBy.asc().nullsLast().op('uuid_ops')
    ),
    index('dashboard_files_deleted_at_idx').using(
      'btree',
      table.deletedAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('dashboard_files_organization_id_idx').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'dashboard_files_created_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.publiclyEnabledBy],
      foreignColumns: [users.id],
      name: 'dashboard_files_publicly_enabled_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.workspaceSharingEnabledBy],
      foreignColumns: [users.id],
      name: 'dashboard_files_workspace_sharing_enabled_by_fkey',
    }).onUpdate('cascade'),
  ]
);

export const reportFiles = pgTable(
  'report_files',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: varchar().notNull(),
    content: text('content').notNull(),
    organizationId: uuid('organization_id').notNull(),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    publiclyAccessible: boolean('publicly_accessible').default(false).notNull(),
    publiclyEnabledBy: uuid('publicly_enabled_by'),
    publicExpiryDate: timestamp('public_expiry_date', {
      withTimezone: true,
      mode: 'string',
    }),
    versionHistory: jsonb('version_history')
      .$type<
        Record<
          string, //version number as a string
          {
            content: string;
            updated_at: string;
            version_number: number;
          }
        >
      >()
      .default({})
      .notNull(),
    publicPassword: text('public_password'),
    workspaceSharing: workspaceSharingEnum('workspace_sharing').default('none').notNull(),
    workspaceSharingEnabledBy: uuid('workspace_sharing_enabled_by'),
    workspaceSharingEnabledAt: timestamp('workspace_sharing_enabled_at', {
      withTimezone: true,
      mode: 'string',
    }),
    screenshotBucketKey: text('screenshot_bucket_key'),
    screenshotTakenAt: timestamp('screenshot_taken_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index('report_files_created_by_idx').using(
      'btree',
      table.createdBy.asc().nullsLast().op('uuid_ops')
    ),
    index('report_files_deleted_at_idx').using(
      'btree',
      table.deletedAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('report_files_organization_id_idx').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'report_files_created_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.publiclyEnabledBy],
      foreignColumns: [users.id],
      name: 'report_files_publicly_enabled_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.workspaceSharingEnabledBy],
      foreignColumns: [users.id],
      name: 'report_files_workspace_sharing_enabled_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'report_files_organization_id_fkey',
    }).onUpdate('cascade'),
  ]
);

export const chats = pgTable(
  'chats',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: text().notNull(),
    chatType: chatTypeEnum('chat_type').default('analyst').notNull(),
    organizationId: uuid('organization_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
    publiclyAccessible: boolean('publicly_accessible').default(false).notNull(),
    publiclyEnabledBy: uuid('publicly_enabled_by'),
    publicExpiryDate: timestamp('public_expiry_date', {
      withTimezone: true,
      mode: 'string',
    }),
    publicPassword: text('public_password'),
    mostRecentFileId: uuid('most_recent_file_id'),
    mostRecentFileType: assetTypeEnum('most_recent_file_type'),
    mostRecentVersionNumber: integer('most_recent_version_number'),
    slackChatAuthorization: slackChatAuthorizationEnum('slack_chat_authorization'),
    slackThreadTs: text('slack_thread_ts'),
    slackChannelId: text('slack_channel_id'),
    workspaceSharing: workspaceSharingEnum('workspace_sharing').default('none').notNull(),
    workspaceSharingEnabledBy: uuid('workspace_sharing_enabled_by'),
    workspaceSharingEnabledAt: timestamp('workspace_sharing_enabled_at', {
      withTimezone: true,
      mode: 'string',
    }),
    screenshotBucketKey: text('screenshot_bucket_key'),
    screenshotTakenAt: timestamp('screenshot_taken_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index('chats_created_at_idx').using(
      'btree',
      table.createdAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('chats_created_by_idx').using('btree', table.createdBy.asc().nullsLast().op('uuid_ops')),
    index('chats_organization_id_idx').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_chats_most_recent_file_id').using(
      'btree',
      table.mostRecentFileId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_chats_most_recent_file_type').using(
      'btree',
      table.mostRecentFileType.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'chats_organization_id_fkey',
    }),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'chats_created_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [users.id],
      name: 'chats_updated_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.publiclyEnabledBy],
      foreignColumns: [users.id],
      name: 'chats_publicly_enabled_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.workspaceSharingEnabledBy],
      foreignColumns: [users.id],
      name: 'chats_workspace_sharing_enabled_by_fkey',
    }).onUpdate('cascade'),
  ]
);

export const organizations = pgTable(
  'organizations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    domain: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    paymentRequired: boolean('payment_required').default(false).notNull(),
    domains: text('domains').array(),
    restrictNewUserInvitations: boolean('restrict_new_user_invitations').default(false).notNull(),
    defaultRole: userOrganizationRoleEnum('default_role').default('restricted_querier').notNull(),
    organizationColorPalettes: jsonb('organization_color_palettes')
      .$type<OrganizationColorPalettes>()
      .default(
        sql`'{"selectedId": null, "palettes": [], "selectedDictionaryPalette": null}'::jsonb`
      )
      .notNull(),
  },
  (table) => [unique('organizations_name_key').on(table.name)]
);

export const s3Integrations = pgTable(
  's3_integrations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    provider: storageProviderEnum().notNull(),
    organizationId: uuid('organization_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 's3_integrations_organization_id_fkey',
    }).onDelete('cascade'),
    index('idx_s3_integrations_organization_id').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_s3_integrations_deleted_at').using('btree', table.deletedAt.asc().nullsLast()),
  ]
);

export const metricFiles = pgTable(
  'metric_files',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: varchar().notNull(),
    fileName: varchar('file_name').notNull(),
    content: jsonb().notNull(),
    verification: verificationEnum().default('notRequested').notNull(),
    evaluationObj: jsonb('evaluation_obj'),
    evaluationSummary: text('evaluation_summary'),
    evaluationScore: doublePrecision('evaluation_score'),
    organizationId: uuid('organization_id').notNull(),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    publiclyAccessible: boolean('publicly_accessible').default(false).notNull(),
    publiclyEnabledBy: uuid('publicly_enabled_by'),
    publicExpiryDate: timestamp('public_expiry_date', {
      withTimezone: true,
      mode: 'string',
    }),
    versionHistory: jsonb('version_history')
      .$type<
        Record<
          string, //version number as a string
          {
            content: Record<string, unknown>;
            updated_at: string;
            version_number: number;
          }
        >
      >()
      .default({})
      .notNull(),
    dataMetadata: jsonb('data_metadata'),
    publicPassword: text('public_password'),
    dataSourceId: uuid('data_source_id').notNull(),
    workspaceSharing: workspaceSharingEnum('workspace_sharing').default('none').notNull(),
    workspaceSharingEnabledBy: uuid('workspace_sharing_enabled_by'),
    workspaceSharingEnabledAt: timestamp('workspace_sharing_enabled_at', {
      withTimezone: true,
      mode: 'string',
    }),
    screenshotBucketKey: text('screenshot_bucket_key'),
    screenshotTakenAt: timestamp('screenshot_taken_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index('metric_files_created_by_idx').using(
      'btree',
      table.createdBy.asc().nullsLast().op('uuid_ops')
    ),
    index('metric_files_data_metadata_idx').using(
      'gin',
      table.dataMetadata.asc().nullsLast().op('jsonb_ops')
    ),
    index('metric_files_deleted_at_idx').using(
      'btree',
      table.deletedAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('metric_files_organization_id_idx').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'metric_files_created_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.publiclyEnabledBy],
      foreignColumns: [users.id],
      name: 'metric_files_publicly_enabled_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.dataSourceId],
      foreignColumns: [dataSources.id],
      name: 'fk_data_source',
    }),
    foreignKey({
      columns: [table.workspaceSharingEnabledBy],
      foreignColumns: [users.id],
      name: 'metric_files_workspace_sharing_enabled_by_fkey',
    }).onUpdate('cascade'),
  ]
);

export const permissionGroupsToUsers = pgTable(
  'permission_groups_to_users',
  {
    permissionGroupId: uuid('permission_group_id').notNull(),
    userId: uuid('user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('permission_groups_to_users_user_id_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.permissionGroupId],
      foreignColumns: [permissionGroups.id],
      name: 'permission_groups_to_users_permission_group_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'permission_groups_to_users_user_id_fkey',
    }).onUpdate('cascade'),
    primaryKey({
      columns: [table.permissionGroupId, table.userId],
      name: 'permission_groups_to_users_pkey',
    }),
    pgPolicy('permission_groups_to_users_policy', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
    }),
  ]
);

export const metricFilesToDatasets = pgTable(
  'metric_files_to_datasets',
  {
    metricFileId: uuid('metric_file_id').notNull(),
    datasetId: uuid('dataset_id').notNull(),
    metricVersionNumber: integer('metric_version_number').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.metricFileId],
      foreignColumns: [metricFiles.id],
      name: 'fk_metric_file',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.datasetId],
      foreignColumns: [datasets.id],
      name: 'fk_dataset',
    }).onDelete('cascade'),
    primaryKey({
      columns: [table.metricFileId, table.datasetId, table.metricVersionNumber],
      name: 'metric_files_to_datasets_pkey',
    }),
  ]
);

export const datasetsToPermissionGroups = pgTable(
  'datasets_to_permission_groups',
  {
    datasetId: uuid('dataset_id').notNull(),
    permissionGroupId: uuid('permission_group_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.datasetId],
      foreignColumns: [datasets.id],
      name: 'datasets_to_permission_groups_dataset_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.permissionGroupId],
      foreignColumns: [permissionGroups.id],
      name: 'datasets_to_permission_groups_permission_group_id_fkey',
    }).onDelete('cascade'),
    primaryKey({
      columns: [table.datasetId, table.permissionGroupId],
      name: 'datasets_to_permission_groups_pkey',
    }),
    pgPolicy('datasets_to_permission_groups_policy', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
    }),
  ]
);

export const datasetsToDatasetGroups = pgTable(
  'datasets_to_dataset_groups',
  {
    datasetId: uuid('dataset_id').notNull(),
    datasetGroupId: uuid('dataset_group_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index('datasets_to_dataset_groups_dataset_group_id_idx').using(
      'btree',
      table.datasetGroupId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.datasetId],
      foreignColumns: [datasets.id],
      name: 'datasets_to_dataset_groups_dataset_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.datasetGroupId],
      foreignColumns: [datasetGroups.id],
      name: 'datasets_to_dataset_groups_dataset_group_id_fkey',
    }).onDelete('cascade'),
    primaryKey({
      columns: [table.datasetId, table.datasetGroupId],
      name: 'datasets_to_dataset_groups_pkey',
    }),
    pgPolicy('datasets_to_dataset_groups_policy', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
    }),
  ]
);

export const userFavorites = pgTable(
  'user_favorites',
  {
    userId: uuid('user_id').notNull(),
    assetId: uuid('asset_id').notNull(),
    assetType: assetTypeEnum('asset_type').notNull(),
    orderIndex: integer('order_index').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'user_favorites_user_id_fkey',
    }).onUpdate('cascade'),
    primaryKey({
      columns: [table.userId, table.assetId, table.assetType],
      name: 'user_favorites_pkey',
    }),
  ]
);

export const teamsToUsers = pgTable(
  'teams_to_users',
  {
    teamId: uuid('team_id').notNull(),
    userId: uuid('user_id').notNull(),
    role: teamRoleEnum().default('member').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: 'teams_to_users_team_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'teams_to_users_user_id_fkey',
    }).onUpdate('cascade'),
    primaryKey({
      columns: [table.teamId, table.userId],
      name: 'teams_to_users_pkey',
    }),
  ]
);

export const metricFilesToDashboardFiles = pgTable(
  'metric_files_to_dashboard_files',
  {
    metricFileId: uuid('metric_file_id').notNull(),
    dashboardFileId: uuid('dashboard_file_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    createdBy: uuid('created_by').notNull(),
  },
  (table) => [
    index('metric_files_to_dashboard_files_dashboard_id_idx').using(
      'btree',
      table.dashboardFileId.asc().nullsLast().op('uuid_ops')
    ),
    index('metric_files_to_dashboard_files_deleted_at_idx').using(
      'btree',
      table.deletedAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('metric_files_to_dashboard_files_metric_id_idx').using(
      'btree',
      table.metricFileId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.metricFileId],
      foreignColumns: [metricFiles.id],
      name: 'metric_files_to_dashboard_files_metric_file_id_fkey',
    }),
    foreignKey({
      columns: [table.dashboardFileId],
      foreignColumns: [dashboardFiles.id],
      name: 'metric_files_to_dashboard_files_dashboard_file_id_fkey',
    }),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'metric_files_to_dashboard_files_created_by_fkey',
    }).onUpdate('cascade'),
    primaryKey({
      columns: [table.metricFileId, table.dashboardFileId],
      name: 'metric_files_to_dashboard_files_pkey',
    }),
  ]
);

export const metricFilesToReportFiles = pgTable(
  'metric_files_to_report_files',
  {
    metricFileId: uuid('metric_file_id').notNull(),
    reportFileId: uuid('report_file_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    createdBy: uuid('created_by').notNull(),
  },
  (table) => [
    index('metric_files_to_report_files_report_id_idx').using(
      'btree',
      table.reportFileId.asc().nullsLast().op('uuid_ops')
    ),
    index('metric_files_to_report_files_deleted_at_idx').using(
      'btree',
      table.deletedAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('metric_files_to_report_files_metric_id_idx').using(
      'btree',
      table.metricFileId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.metricFileId],
      foreignColumns: [metricFiles.id],
      name: 'metric_files_to_report_files_metric_file_id_fkey',
    }),
    foreignKey({
      columns: [table.reportFileId],
      foreignColumns: [reportFiles.id],
      name: 'metric_files_to_report_files_report_file_id_fkey',
    }),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'metric_files_to_report_files_created_by_fkey',
    }).onUpdate('cascade'),
    primaryKey({
      columns: [table.metricFileId, table.reportFileId],
      name: 'metric_files_to_report_files_pkey',
    }),
  ]
);

export const collectionsToAssets = pgTable(
  'collections_to_assets',
  {
    collectionId: uuid('collection_id').notNull(),
    assetId: uuid('asset_id').notNull(),
    assetType: assetTypeEnum('asset_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'collections_to_assets_created_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [users.id],
      name: 'collections_to_assets_updated_by_fkey',
    }).onUpdate('cascade'),
    primaryKey({
      columns: [table.collectionId, table.assetId, table.assetType],
      name: 'collections_to_assets_pkey',
    }),
    // Performance index for active collections lookup by asset
    index('idx_cta_active_by_asset')
      .on(table.assetId, table.assetType, table.collectionId)
      .where(isNull(table.deletedAt)),
  ]
);

export const permissionGroupsToIdentities = pgTable(
  'permission_groups_to_identities',
  {
    permissionGroupId: uuid('permission_group_id').notNull(),
    identityId: uuid('identity_id').notNull(),
    identityType: identityTypeEnum('identity_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'permission_groups_to_identities_created_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [users.id],
      name: 'permission_groups_to_identities_updated_by_fkey',
    }).onUpdate('cascade'),
    primaryKey({
      columns: [table.permissionGroupId, table.identityId, table.identityType],
      name: 'permission_groups_to_identities_pkey',
    }),
  ]
);

export const assetPermissions = pgTable(
  'asset_permissions',
  {
    identityId: uuid('identity_id').notNull(),
    identityType: identityTypeEnum('identity_type').notNull(),
    assetId: uuid('asset_id').notNull(),
    assetType: assetTypeEnum('asset_type').notNull(),
    role: assetPermissionRoleEnum().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'asset_permissions_created_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [users.id],
      name: 'asset_permissions_updated_by_fkey',
    }).onUpdate('cascade'),
    primaryKey({
      columns: [table.identityId, table.identityType, table.assetId, table.assetType],
      name: 'asset_permissions_pkey',
    }),
    // Performance index for active permissions lookup by asset and identity
    index('idx_perm_active_asset_identity')
      .on(table.assetId, table.assetType, table.identityId, table.identityType)
      .where(isNull(table.deletedAt)),
    index('idx_perm_active_identity_asset')
      .on(table.identityType, table.identityId, table.assetType, table.assetId)
      .where(isNull(table.deletedAt)),
  ]
);

export const usersToOrganizations = pgTable(
  'users_to_organizations',
  {
    userId: uuid('user_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    role: userOrganizationRoleEnum().default('querier').notNull(),
    sharingSetting: sharingSettingEnum('sharing_setting').default('none').notNull(),
    editSql: boolean('edit_sql').default(false).notNull(),
    uploadCsv: boolean('upload_csv').default(false).notNull(),
    exportAssets: boolean('export_assets').default(false).notNull(),
    emailSlackEnabled: boolean('email_slack_enabled').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
    deletedBy: uuid('deleted_by'),
    status: userOrganizationStatusEnum().default('active').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'users_to_organizations_organization_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'users_to_organizations_user_id_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'users_to_organizations_created_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [users.id],
      name: 'users_to_organizations_updated_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.deletedBy],
      foreignColumns: [users.id],
      name: 'users_to_organizations_deleted_by_fkey',
    }).onUpdate('cascade'),
    primaryKey({
      columns: [table.userId, table.organizationId],
      name: 'users_to_organizations_pkey',
    }),
    // Performance index for active user organization lookup
    index('idx_uto_active_by_user')
      .on(table.userId, table.organizationId)
      .where(isNull(table.deletedAt)),
  ]
);

// Slack integrations table
export const slackIntegrations = pgTable(
  'slack_integrations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    organizationId: uuid('organization_id').notNull(),
    userId: uuid('user_id').notNull(),

    // OAuth state fields (for pending integrations)
    oauthState: varchar('oauth_state', { length: 255 }).unique(),
    oauthExpiresAt: timestamp('oauth_expires_at', {
      withTimezone: true,
      mode: 'string',
    }),
    oauthMetadata: jsonb('oauth_metadata').default({}),

    // Slack workspace info (populated after successful OAuth)
    teamId: varchar('team_id', { length: 255 }),
    teamName: varchar('team_name', { length: 255 }),
    teamDomain: varchar('team_domain', { length: 255 }),
    enterpriseId: varchar('enterprise_id', { length: 255 }),

    // Bot info
    botUserId: varchar('bot_user_id', { length: 255 }),
    scope: text(),

    // Token reference (actual token in Supabase Vault)
    tokenVaultKey: varchar('token_vault_key', { length: 255 }).unique(),

    // Metadata
    installedBySlackUserId: varchar('installed_by_slack_user_id', {
      length: 255,
    }),
    installedAt: timestamp('installed_at', {
      withTimezone: true,
      mode: 'string',
    }),
    lastUsedAt: timestamp('last_used_at', {
      withTimezone: true,
      mode: 'string',
    }),
    status: slackIntegrationStatusEnum().default('pending').notNull(),

    // Default channel configuration
    defaultChannel: jsonb('default_channel')
      .$type<{ id: string; name: string } | Record<string, never>>()
      .default({}),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),

    // Default Sharing Permissions in Slack
    defaultSharingPermissions: slackSharingPermissionEnum('default_sharing_permissions')
      .default('shareWithChannel')
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'slack_integrations_organization_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'slack_integrations_user_id_fkey',
    }),
    unique('slack_integrations_org_team_key').on(table.organizationId, table.teamId),
    index('idx_slack_integrations_org_id').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_slack_integrations_team_id').using(
      'btree',
      table.teamId.asc().nullsLast().op('text_ops')
    ),
    index('idx_slack_integrations_oauth_state').using(
      'btree',
      table.oauthState.asc().nullsLast().op('text_ops')
    ),
    index('idx_slack_integrations_oauth_expires').using(
      'btree',
      table.oauthExpiresAt.asc().nullsLast().op('timestamptz_ops')
    ),
    check(
      'slack_integrations_status_check',
      sql`(status = 'pending' AND oauth_state IS NOT NULL) OR (status != 'pending' AND team_id IS NOT NULL)`
    ),
  ]
);

// GitHub integrations table
export const githubIntegrations = pgTable(
  'github_integrations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    organizationId: uuid('organization_id').notNull(),
    userId: uuid('user_id').notNull(),

    installationId: varchar('installation_id', { length: 255 }).notNull(),
    appId: varchar('app_id', { length: 255 }),

    githubOrgId: varchar('github_org_id', { length: 255 }).notNull(),
    githubOrgName: varchar('github_org_name', { length: 255 }),

    tokenVaultKey: varchar('token_vault_key', { length: 255 }).unique(),
    webhookSecretVaultKey: varchar('webhook_secret_vault_key', { length: 255 }),

    repositoryPermissions: jsonb('repository_permissions').default({}),

    status: githubIntegrationStatusEnum().default('pending').notNull(),
    installedAt: timestamp('installed_at', {
      withTimezone: true,
      mode: 'string',
    }),
    lastUsedAt: timestamp('last_used_at', {
      withTimezone: true,
      mode: 'string',
    }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'github_integrations_organization_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'github_integrations_user_id_fkey',
    }).onDelete('set null'),
    unique('github_integrations_org_installation_key').on(
      table.organizationId,
      table.installationId
    ),
    index('idx_github_integrations_org_id').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_github_integrations_installation_id').using(
      'btree',
      table.installationId.asc().nullsLast().op('text_ops')
    ),
    index('idx_github_integrations_github_org_id').using(
      'btree',
      table.githubOrgId.asc().nullsLast().op('text_ops')
    ),
  ]
);

// Slack message tracking table (optional)
export const slackMessageTracking = pgTable(
  'slack_message_tracking',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    integrationId: uuid('integration_id').notNull(),

    // Internal reference
    internalMessageId: uuid('internal_message_id').notNull().unique(),

    // Slack references
    slackChannelId: varchar('slack_channel_id', { length: 255 }).notNull(),
    slackMessageTs: varchar('slack_message_ts', { length: 255 }).notNull(),
    slackThreadTs: varchar('slack_thread_ts', { length: 255 }),

    // Metadata
    messageType: varchar('message_type', { length: 50 }).notNull(), // Source of the message (e.g., 'analyst_message_post_processing')
    content: text(),
    senderInfo: jsonb('sender_info'),

    // Timestamps
    sentAt: timestamp('sent_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.integrationId],
      foreignColumns: [slackIntegrations.id],
      name: 'slack_message_tracking_integration_id_fkey',
    }).onDelete('cascade'),
    index('idx_message_tracking_integration').using(
      'btree',
      table.integrationId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_message_tracking_channel').using(
      'btree',
      table.slackChannelId.asc().nullsLast().op('text_ops')
    ),
    index('idx_message_tracking_thread').using(
      'btree',
      table.slackThreadTs.asc().nullsLast().op('text_ops')
    ),
  ]
);

// Join table between messages and slack messages
export const messagesToSlackMessages = pgTable(
  'messages_to_slack_messages',
  {
    messageId: uuid('message_id').notNull(),
    slackMessageId: uuid('slack_message_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    // Foreign keys
    foreignKey({
      columns: [table.messageId],
      foreignColumns: [messages.id],
      name: 'messages_to_slack_messages_message_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.slackMessageId],
      foreignColumns: [slackMessageTracking.id],
      name: 'messages_to_slack_messages_slack_message_id_fkey',
    }).onDelete('cascade'),
    // Composite primary key
    primaryKey({
      columns: [table.messageId, table.slackMessageId],
      name: 'messages_to_slack_messages_pkey',
    }),
    // Indexes for query performance
    index('messages_to_slack_messages_message_id_idx').using(
      'btree',
      table.messageId.asc().nullsLast().op('uuid_ops')
    ),
    index('messages_to_slack_messages_slack_message_id_idx').using(
      'btree',
      table.slackMessageId.asc().nullsLast().op('uuid_ops')
    ),
  ]
);

export const shortcuts = pgTable(
  'shortcuts',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    instructions: text().notNull(),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by'),
    organizationId: uuid('organization_id').notNull(),
    shareWithWorkspace: boolean('share_with_workspace').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    // Foreign keys
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'shortcuts_created_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [users.id],
      name: 'shortcuts_updated_by_fkey',
    }).onUpdate('cascade'),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'shortcuts_organization_id_fkey',
    }).onDelete('cascade'),
    // Unique constraints
    unique('shortcuts_personal_unique').on(table.name, table.organizationId, table.createdBy),
    // Indexes
    index('shortcuts_org_user_idx').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops'),
      table.createdBy.asc().nullsLast().op('uuid_ops')
    ),
    index('shortcuts_name_idx').using('btree', table.name.asc().nullsLast()),
    // Conditional unique constraint for workspace shortcuts
    uniqueIndex('shortcuts_workspace_unique')
      .on(table.name, table.organizationId)
      .where(sql`${table.shareWithWorkspace} = true`),
  ]
);

export const docs = pgTable(
  'docs',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    content: text().notNull(),
    type: docsTypeEnum().default('normal').notNull(),
    organizationId: uuid('organization_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'docs_organization_id_fkey',
    }).onDelete('cascade'),
    unique('docs_name_organization_id_key').on(table.name, table.organizationId),
  ]
);

export const assetSearchV2 = pgTable(
  'asset_search_v2',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    assetType: assetTypeEnum('asset_type').notNull(),
    assetId: uuid('asset_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    title: text('title').notNull(),
    additionalText: text('additional_text'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    screenshotBucketKey: text('screenshot_bucket_key'),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'asset_search_v2_organization_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'asset_search_v2_created_by_fkey',
    }).onDelete('cascade'),
    index('pgroonga_search_title_description_index').using(
      'pgroonga',
      table.title.asc().nullsLast().op('pgroonga_text_full_text_search_ops_v2'),
      table.additionalText.asc().nullsLast().op('pgroonga_text_full_text_search_ops_v2')
    ),
    unique('asset_search_v2_asset_type_asset_id_unique').on(table.assetId, table.assetType),
    index('idx_as2_active_by_asset')
      .on(table.assetId, table.assetType)
      .where(isNull(table.deletedAt)),
    index('idx_as2_active_by_org').on(table.organizationId).where(isNull(table.deletedAt)),
  ]
);

// Logs writeback configuration for external data sources
export const logsWriteBackConfigs = pgTable(
  'logs_write_back_configs',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    organizationId: uuid('organization_id').notNull(),
    dataSourceId: uuid('data_source_id').notNull(),
    database: varchar('database', { length: 255 }).notNull(),
    schema: varchar('schema', { length: 255 }).notNull(),
    tableName: varchar('table_name', { length: 255 }).default('buster_query_logs').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'logs_write_back_configs_organization_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.dataSourceId],
      foreignColumns: [dataSources.id],
      name: 'logs_write_back_configs_data_source_id_fkey',
    }).onDelete('cascade'),
    // Ensure only one active config per organization
    uniqueIndex('logs_write_back_configs_org_unique')
      .on(table.organizationId)
      .where(sql`${table.deletedAt} IS NULL`),
    // Indexes for efficient lookups
    index('idx_logs_write_back_configs_org_id').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_logs_write_back_configs_data_source_id').using(
      'btree',
      table.dataSourceId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_logs_write_back_configs_deleted_at').using(
      'btree',
      table.deletedAt.asc().nullsLast()
    ),
  ]
);

export const userLibrary = pgTable(
  'user_library',
  {
    userId: uuid('user_id').notNull(),
    assetType: assetTypeEnum('asset_type').notNull(),
    assetId: uuid('asset_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'user_library_user_id_fkey',
    }).onUpdate('cascade'),
    primaryKey({
      columns: [table.userId, table.assetType, table.assetId],
      name: 'user_library_pkey',
    }),
  ]
);

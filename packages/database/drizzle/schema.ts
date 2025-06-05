import { pgTable, foreignKey, unique, uuid, text, timestamp, boolean, jsonb, varchar, bigint, uniqueIndex, index, vector, pgPolicy, check, integer, doublePrecision, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const assetPermissionRoleEnum = pgEnum("asset_permission_role_enum", ['owner', 'editor', 'viewer', 'full_access', 'can_edit', 'can_filter', 'can_view'])
export const assetTypeEnum = pgEnum("asset_type_enum", ['dashboard', 'thread', 'collection', 'chat', 'metric_file', 'dashboard_file'])
export const dataSourceOnboardingStatusEnum = pgEnum("data_source_onboarding_status_enum", ['notStarted', 'inProgress', 'completed', 'failed'])
export const datasetTypeEnum = pgEnum("dataset_type_enum", ['table', 'view', 'materializedView'])
export const identityTypeEnum = pgEnum("identity_type_enum", ['user', 'team', 'organization'])
export const messageFeedbackEnum = pgEnum("message_feedback_enum", ['positive', 'negative'])
export const sharingSettingEnum = pgEnum("sharing_setting_enum", ['none', 'team', 'organization', 'public'])
export const storedValuesStatusEnum = pgEnum("stored_values_status_enum", ['syncing', 'success', 'failed'])
export const teamRoleEnum = pgEnum("team_role_enum", ['manager', 'member'])
export const userOrganizationRoleEnum = pgEnum("user_organization_role_enum", ['workspace_admin', 'data_admin', 'querier', 'restricted_querier', 'viewer'])
export const userOrganizationStatusEnum = pgEnum("user_organization_status_enum", ['active', 'inactive', 'pending', 'guest'])
export const verificationEnum = pgEnum("verification_enum", ['verified', 'backlogged', 'inReview', 'requested', 'notRequested'])


export const apiKeys = pgTable("api_keys", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ownerId: uuid("owner_id").notNull(),
	key: text().notNull(),
	organizationId: uuid("organization_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => {
	return {
		apiKeysOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "api_keys_organization_id_fkey"
		}).onDelete("cascade"),
		apiKeysOwnerIdFkey: foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "api_keys_owner_id_fkey"
		}).onUpdate("cascade"),
		apiKeysKeyKey: unique("api_keys_key_key").on(table.key),
	}
});

export const teams = pgTable("teams", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	organizationId: uuid("organization_id").notNull(),
	sharingSetting: sharingSettingEnum("sharing_setting").default('none').notNull(),
	editSql: boolean("edit_sql").default(false).notNull(),
	uploadCsv: boolean("upload_csv").default(false).notNull(),
	exportAssets: boolean("export_assets").default(false).notNull(),
	emailSlackEnabled: boolean("email_slack_enabled").default(false).notNull(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => {
	return {
		teamsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "teams_organization_id_fkey"
		}).onDelete("cascade"),
		teamsCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "teams_created_by_fkey"
		}).onUpdate("cascade"),
		teamsNameKey: unique("teams_name_key").on(table.name),
	}
});

export const permissionGroups = pgTable("permission_groups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	organizationId: uuid("organization_id").notNull(),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => {
	return {
		permissionGroupsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "permission_groups_organization_id_fkey"
		}).onDelete("cascade"),
		permissionGroupsCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "permission_groups_created_by_fkey"
		}).onUpdate("cascade"),
		permissionGroupsUpdatedByFkey: foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "permission_groups_updated_by_fkey"
		}).onUpdate("cascade"),
	}
});

export const terms = pgTable("terms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	definition: text(),
	sqlSnippet: text("sql_snippet"),
	organizationId: uuid("organization_id").notNull(),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => {
	return {
		termsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "terms_organization_id_fkey"
		}).onDelete("cascade"),
		termsCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "terms_created_by_fkey"
		}).onUpdate("cascade"),
		termsUpdatedByFkey: foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "terms_updated_by_fkey"
		}).onUpdate("cascade"),
	}
});

export const collections = pgTable("collections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	organizationId: uuid("organization_id").notNull(),
}, (table) => {
	return {
		collectionsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "collections_organization_id_fkey"
		}).onUpdate("cascade"),
		collectionsCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "collections_created_by_fkey"
		}).onUpdate("cascade"),
		collectionsUpdatedByFkey: foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "collections_updated_by_fkey"
		}).onUpdate("cascade"),
	}
});

export const dashboards = pgTable("dashboards", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	config: jsonb().notNull(),
	publiclyAccessible: boolean("publicly_accessible").default(false).notNull(),
	publiclyEnabledBy: uuid("publicly_enabled_by"),
	publicExpiryDate: timestamp("public_expiry_date", { withTimezone: true, mode: 'string' }),
	passwordSecretId: uuid("password_secret_id"),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	organizationId: uuid("organization_id").notNull(),
}, (table) => {
	return {
		dashboardsPubliclyEnabledByFkey: foreignKey({
			columns: [table.publiclyEnabledBy],
			foreignColumns: [users.id],
			name: "dashboards_publicly_enabled_by_fkey"
		}).onUpdate("cascade"),
		dashboardsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "dashboards_organization_id_fkey"
		}).onUpdate("cascade"),
		dashboardsCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "dashboards_created_by_fkey"
		}).onUpdate("cascade"),
		dashboardsUpdatedByFkey: foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "dashboards_updated_by_fkey"
		}).onUpdate("cascade"),
	}
});

export const dashboardVersions = pgTable("dashboard_versions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dashboardId: uuid("dashboard_id").notNull(),
	config: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => {
	return {
		dashboardVersionsDashboardIdFkey: foreignKey({
			columns: [table.dashboardId],
			foreignColumns: [dashboards.id],
			name: "dashboard_versions_dashboard_id_fkey"
		}).onDelete("cascade"),
	}
});

export const dataSources = pgTable("data_sources", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	secretId: uuid("secret_id").notNull(),
	onboardingStatus: dataSourceOnboardingStatusEnum("onboarding_status").default('notStarted').notNull(),
	onboardingError: text("onboarding_error"),
	organizationId: uuid("organization_id").notNull(),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	env: varchar().default('dev').notNull(),
}, (table) => {
	return {
		dataSourcesOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "data_sources_organization_id_fkey"
		}).onDelete("cascade"),
		dataSourcesCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "data_sources_created_by_fkey"
		}).onUpdate("cascade"),
		dataSourcesUpdatedByFkey: foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "data_sources_updated_by_fkey"
		}).onUpdate("cascade"),
		dataSourcesNameOrganizationIdEnvKey: unique("data_sources_name_organization_id_env_key").on(table.name, table.organizationId, table.env),
	}
});

export const datasetColumns = pgTable("dataset_columns", {
	id: uuid().primaryKey().notNull(),
	datasetId: uuid("dataset_id").notNull(),
	name: text().notNull(),
	type: text().notNull(),
	description: text(),
	nullable: boolean().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	storedValues: boolean("stored_values").default(false),
	storedValuesStatus: storedValuesStatusEnum("stored_values_status"),
	storedValuesError: text("stored_values_error"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	storedValuesCount: bigint("stored_values_count", { mode: "number" }),
	storedValuesLastSynced: timestamp("stored_values_last_synced", { withTimezone: true, mode: 'string' }),
	semanticType: text("semantic_type"),
	dimType: text("dim_type"),
	expr: text(),
}, (table) => {
	return {
		uniqueDatasetColumnName: unique("unique_dataset_column_name").on(table.datasetId, table.name),
	}
});

export const sqlEvaluations = pgTable("sql_evaluations", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	evaluationObj: jsonb("evaluation_obj").notNull(),
	evaluationSummary: text("evaluation_summary").notNull(),
	score: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
});

export const assetSearch = pgTable("asset_search", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assetId: uuid("asset_id").notNull(),
	assetType: text("asset_type").notNull(),
	content: text().notNull(),
	organizationId: uuid("organization_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => {
	return {
		assetIdAssetTypeIdx: uniqueIndex("asset_search_asset_id_asset_type_idx").using("btree", table.assetId.asc().nullsLast().op("text_ops"), table.assetType.asc().nullsLast().op("text_ops")),
		pgroongaContentIdx: index("pgroonga_content_index").using("pgroonga", table.content.asc().nullsLast().op("pgroonga_text_full_text_search_ops_v2")),
	}
});

export const termsSearch = pgTable("terms_search", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	termId: uuid("term_id").notNull(),
	content: text().notNull(),
	definition: text().notNull(),
	// TODO: failed to parse database type 'tsvector'
	fts: unknown("fts").generatedAlwaysAs(sql`to_tsvector('simple'::regconfig, content)`),
	embedding: vector({ dimensions: 1024 }),
	organizationId: uuid("organization_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => {
	return {
		embeddingIdx: index("terms_search_embedding_idx").using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops")),
		ftsIdx: index("terms_search_fts_idx").using("gin", table.fts.asc().nullsLast().op("tsvector_ops")),
		termIdOrganizationIdIdx: index("terms_search_term_id_organization_id_idx").using("btree", table.termId.asc().nullsLast().op("uuid_ops"), table.organizationId.asc().nullsLast().op("uuid_ops")),
		termsSearchOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "terms_search_organization_id_fkey"
		}),
		termsSearchTermIdKey: unique("terms_search_term_id_key").on(table.termId),
	}
});

export const datasetGroups = pgTable("dataset_groups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	name: varchar().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => {
	return {
		deletedAtIdx: index("dataset_groups_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
		organizationIdIdx: index("dataset_groups_organization_id_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
		datasetGroupsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "dataset_groups_organization_id_fkey"
		}).onDelete("cascade"),
		datasetGroupsPolicy: pgPolicy("dataset_groups_policy", { as: "permissive", for: "all", to: ["authenticated"], using: sql`true` }),
	}
});

export const datasetPermissions = pgTable("dataset_permissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	datasetId: uuid("dataset_id").notNull(),
	permissionId: uuid("permission_id").notNull(),
	permissionType: varchar("permission_type").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => {
	return {
		datasetIdIdx: index("dataset_permissions_dataset_id_idx").using("btree", table.datasetId.asc().nullsLast().op("uuid_ops")),
		deletedAtIdx: index("dataset_permissions_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
		organizationIdIdx: index("dataset_permissions_organization_id_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
		permissionLookupIdx: index("dataset_permissions_permission_lookup_idx").using("btree", table.permissionId.asc().nullsLast().op("uuid_ops"), table.permissionType.asc().nullsLast().op("text_ops")),
		datasetPermissionsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "dataset_permissions_organization_id_fkey"
		}).onDelete("cascade"),
		datasetPermissionsDatasetIdFkey: foreignKey({
			columns: [table.datasetId],
			foreignColumns: [datasets.id],
			name: "dataset_permissions_dataset_id_fkey"
		}).onDelete("cascade"),
		datasetPermissionsDatasetIdPermissionIdPermissionTypKey: unique("dataset_permissions_dataset_id_permission_id_permission_typ_key").on(table.datasetId, table.permissionId, table.permissionType),
		datasetPermissionsPolicy: pgPolicy("dataset_permissions_policy", { as: "permissive", for: "all", to: ["authenticated"], using: sql`true` }),
		datasetPermissionsPermissionTypeCheck: check("dataset_permissions_permission_type_check", sql`(permission_type)::text = ANY ((ARRAY['user'::character varying, 'dataset_group'::character varying, 'permission_group'::character varying])::text[])`),
	}
});

export const dieselSchemaMigrations = pgTable("__diesel_schema_migrations", {
	version: varchar({ length: 50 }).primaryKey().notNull(),
	runOn: timestamp("run_on", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => {
	return {
		dieselSchemaMigrationsPolicy: pgPolicy("diesel_schema_migrations_policy", { as: "permissive", for: "all", to: ["authenticated"], using: sql`true` }),
	}
});

export const datasetGroupsPermissions = pgTable("dataset_groups_permissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	datasetGroupId: uuid("dataset_group_id").notNull(),
	permissionId: uuid("permission_id").notNull(),
	permissionType: varchar("permission_type").notNull(),
	organizationId: uuid("organization_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => {
	return {
		datasetGroupIdIdx: index("dataset_groups_permissions_dataset_group_id_idx").using("btree", table.datasetGroupId.asc().nullsLast().op("uuid_ops")),
		organizationIdIdx: index("dataset_groups_permissions_organization_id_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
		permissionIdIdx: index("dataset_groups_permissions_permission_id_idx").using("btree", table.permissionId.asc().nullsLast().op("uuid_ops")),
		datasetGroupsPermissionsDatasetGroupIdFkey: foreignKey({
			columns: [table.datasetGroupId],
			foreignColumns: [datasetGroups.id],
			name: "dataset_groups_permissions_dataset_group_id_fkey"
		}),
		datasetGroupsPermissionsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "dataset_groups_permissions_organization_id_fkey"
		}),
		uniqueDatasetGroupPermission: unique("unique_dataset_group_permission").on(table.datasetGroupId, table.permissionId, table.permissionType),
	}
});

export const threadsDeprecated = pgTable("threads_deprecated", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by").notNull(),
	publiclyAccessible: boolean("publicly_accessible").default(false).notNull(),
	publiclyEnabledBy: uuid("publicly_enabled_by"),
	publicExpiryDate: timestamp("public_expiry_date", { withTimezone: true, mode: 'string' }),
	passwordSecretId: uuid("password_secret_id"),
	stateMessageId: uuid("state_message_id"),
	parentThreadId: uuid("parent_thread_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	organizationId: uuid("organization_id").notNull(),
}, (table) => {
	return {
		threadsCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "threads_created_by_fkey"
		}).onUpdate("cascade"),
		threadsUpdatedByFkey: foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "threads_updated_by_fkey"
		}).onUpdate("cascade"),
		threadsPubliclyEnabledByFkey: foreignKey({
			columns: [table.publiclyEnabledBy],
			foreignColumns: [users.id],
			name: "threads_publicly_enabled_by_fkey"
		}).onUpdate("cascade"),
		threadsParentThreadIdFkey: foreignKey({
			columns: [table.parentThreadId],
			foreignColumns: [table.id],
			name: "threads_parent_thread_id_fkey"
		}).onUpdate("cascade"),
		threadsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "threads_organization_id_fkey"
		}),
		threadsDeprecatedCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "threads_deprecated_created_by_fkey"
		}).onUpdate("cascade"),
		threadsDeprecatedUpdatedByFkey: foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "threads_deprecated_updated_by_fkey"
		}).onUpdate("cascade"),
		threadsDeprecatedPubliclyEnabledByFkey: foreignKey({
			columns: [table.publiclyEnabledBy],
			foreignColumns: [users.id],
			name: "threads_deprecated_publicly_enabled_by_fkey"
		}).onUpdate("cascade"),
	}
});

export const messagesDeprecated = pgTable("messages_deprecated", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	threadId: uuid("thread_id").notNull(),
	sentBy: uuid("sent_by").notNull(),
	message: text().notNull(),
	responses: jsonb(),
	code: text(),
	context: jsonb(),
	title: text(),
	feedback: messageFeedbackEnum(),
	verification: verificationEnum().default('notRequested').notNull(),
	datasetId: uuid("dataset_id"),
	chartConfig: jsonb("chart_config").default({}),
	chartRecommendations: jsonb("chart_recommendations").default({}),
	timeFrame: text("time_frame"),
	dataMetadata: jsonb("data_metadata"),
	draftSessionId: uuid("draft_session_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	draftState: jsonb("draft_state"),
	summaryQuestion: text("summary_question"),
	sqlEvaluationId: uuid("sql_evaluation_id"),
}, (table) => {
	return {
		messagesSentByFkey: foreignKey({
			columns: [table.sentBy],
			foreignColumns: [users.id],
			name: "messages_sent_by_fkey"
		}).onUpdate("cascade"),
		messagesDatasetIdFkey: foreignKey({
			columns: [table.datasetId],
			foreignColumns: [datasets.id],
			name: "messages_dataset_id_fkey"
		}).onDelete("cascade"),
		messagesDeprecatedSentByFkey: foreignKey({
			columns: [table.sentBy],
			foreignColumns: [users.id],
			name: "messages_deprecated_sent_by_fkey"
		}).onUpdate("cascade"),
	}
});

export const datasets = pgTable("datasets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	databaseName: text("database_name").notNull(),
	whenToUse: text("when_to_use"),
	whenNotToUse: text("when_not_to_use"),
	type: datasetTypeEnum().notNull(),
	definition: text().notNull(),
	schema: text().notNull(),
	enabled: boolean().default(false).notNull(),
	imported: boolean().default(false).notNull(),
	dataSourceId: uuid("data_source_id").notNull(),
	organizationId: uuid("organization_id").notNull(),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	model: text(),
	ymlFile: text("yml_file"),
	databaseIdentifier: text("database_identifier"),
}, (table) => {
	return {
		datasetsDataSourceIdFkey: foreignKey({
			columns: [table.dataSourceId],
			foreignColumns: [dataSources.id],
			name: "datasets_data_source_id_fkey"
		}).onDelete("cascade"),
		datasetsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "datasets_organization_id_fkey"
		}).onDelete("cascade"),
		datasetsCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "datasets_created_by_fkey"
		}).onUpdate("cascade"),
		datasetsUpdatedByFkey: foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "datasets_updated_by_fkey"
		}).onUpdate("cascade"),
		datasetsDatabaseNameDataSourceIdKey: unique("datasets_database_name_data_source_id_key").on(table.databaseName, table.dataSourceId),
	}
});

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	name: text(),
	config: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	attributes: jsonb().default({}).notNull(),
	avatarUrl: text("avatar_url"),
}, (table) => {
	return {
		usersEmailKey: unique("users_email_key").on(table.email),
	}
});

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	requestMessage: text("request_message"),
	responseMessages: jsonb("response_messages").notNull(),
	reasoning: jsonb().notNull(),
	title: text().notNull(),
	rawLlmMessages: jsonb("raw_llm_messages").notNull(),
	finalReasoningMessage: text("final_reasoning_message"),
	chatId: uuid("chat_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	createdBy: uuid("created_by").notNull(),
	feedback: text(),
	isCompleted: boolean("is_completed").default(false).notNull(),
}, (table) => {
	return {
		chatIdIdx: index("messages_chat_id_idx").using("btree", table.chatId.asc().nullsLast().op("uuid_ops")),
		createdAtIdx: index("messages_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
		createdByIdx: index("messages_created_by_idx").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")),
		messagesChatIdFkey: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chats.id],
			name: "messages_chat_id_fkey"
		}),
		messagesCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "messages_created_by_fkey"
		}).onUpdate("cascade"),
	}
});

export const messagesToFiles = pgTable("messages_to_files", {
	id: uuid().primaryKey().notNull(),
	messageId: uuid("message_id").notNull(),
	fileId: uuid("file_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	isDuplicate: boolean("is_duplicate").default(false).notNull(),
	versionNumber: integer("version_number").default(1).notNull(),
}, (table) => {
	return {
		messagesFilesFileIdIdx: index("messages_files_file_id_idx").using("btree", table.fileId.asc().nullsLast().op("uuid_ops")),
		messagesFilesMessageIdIdx: index("messages_files_message_id_idx").using("btree", table.messageId.asc().nullsLast().op("uuid_ops")),
		messagesToFilesMessageIdFkey: foreignKey({
			columns: [table.messageId],
			foreignColumns: [messages.id],
			name: "messages_to_files_message_id_fkey"
		}),
		messagesToFilesMessageIdFileIdKey: unique("messages_to_files_message_id_file_id_key").on(table.messageId, table.fileId),
	}
});

export const dashboardFiles = pgTable("dashboard_files", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar().notNull(),
	fileName: varchar("file_name").notNull(),
	content: jsonb().notNull(),
	filter: varchar(),
	organizationId: uuid("organization_id").notNull(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	publiclyAccessible: boolean("publicly_accessible").default(false).notNull(),
	publiclyEnabledBy: uuid("publicly_enabled_by"),
	publicExpiryDate: timestamp("public_expiry_date", { withTimezone: true, mode: 'string' }),
	versionHistory: jsonb("version_history").default({}).notNull(),
	publicPassword: text("public_password"),
}, (table) => {
	return {
		createdByIdx: index("dashboard_files_created_by_idx").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")),
		deletedAtIdx: index("dashboard_files_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
		organizationIdIdx: index("dashboard_files_organization_id_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
		dashboardFilesCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "dashboard_files_created_by_fkey"
		}).onUpdate("cascade"),
		dashboardFilesPubliclyEnabledByFkey: foreignKey({
			columns: [table.publiclyEnabledBy],
			foreignColumns: [users.id],
			name: "dashboard_files_publicly_enabled_by_fkey"
		}).onUpdate("cascade"),
	}
});

export const chats = pgTable("chats", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	organizationId: uuid("organization_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by").notNull(),
	publiclyAccessible: boolean("publicly_accessible").default(false).notNull(),
	publiclyEnabledBy: uuid("publicly_enabled_by"),
	publicExpiryDate: timestamp("public_expiry_date", { withTimezone: true, mode: 'string' }),
	mostRecentFileId: uuid("most_recent_file_id"),
	mostRecentFileType: varchar("most_recent_file_type", { length: 255 }),
	mostRecentVersionNumber: integer("most_recent_version_number"),
}, (table) => {
	return {
		createdAtIdx: index("chats_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
		createdByIdx: index("chats_created_by_idx").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")),
		organizationIdIdx: index("chats_organization_id_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
		idxChatsMostRecentFileId: index("idx_chats_most_recent_file_id").using("btree", table.mostRecentFileId.asc().nullsLast().op("uuid_ops")),
		idxChatsMostRecentFileType: index("idx_chats_most_recent_file_type").using("btree", table.mostRecentFileType.asc().nullsLast().op("text_ops")),
		chatsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "chats_organization_id_fkey"
		}),
		chatsCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "chats_created_by_fkey"
		}).onUpdate("cascade"),
		chatsUpdatedByFkey: foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "chats_updated_by_fkey"
		}).onUpdate("cascade"),
		chatsPubliclyEnabledByFkey: foreignKey({
			columns: [table.publiclyEnabledBy],
			foreignColumns: [users.id],
			name: "chats_publicly_enabled_by_fkey"
		}).onUpdate("cascade"),
	}
});

export const organizations = pgTable("organizations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	domain: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	paymentRequired: boolean("payment_required").default(false).notNull(),
}, (table) => {
	return {
		organizationsNameKey: unique("organizations_name_key").on(table.name),
	}
});

export const storedValuesSyncJobs = pgTable("stored_values_sync_jobs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dataSourceId: uuid("data_source_id").notNull(),
	databaseName: text("database_name").notNull(),
	schemaName: text("schema_name").notNull(),
	tableName: text("table_name").notNull(),
	columnName: text("column_name").notNull(),
	lastSyncedAt: timestamp("last_synced_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	status: text().notNull(),
	errorMessage: text("error_message"),
}, (table) => {
	return {
		idxStoredValuesSyncJobsDataSourceId: index("idx_stored_values_sync_jobs_data_source_id").using("btree", table.dataSourceId.asc().nullsLast().op("uuid_ops")),
		idxStoredValuesSyncJobsDbSchemaTableColumn: index("idx_stored_values_sync_jobs_db_schema_table_column").using("btree", table.databaseName.asc().nullsLast().op("text_ops"), table.schemaName.asc().nullsLast().op("text_ops"), table.tableName.asc().nullsLast().op("text_ops"), table.columnName.asc().nullsLast().op("text_ops")),
		idxStoredValuesSyncJobsStatus: index("idx_stored_values_sync_jobs_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
		storedValuesSyncJobsDataSourceIdFkey: foreignKey({
			columns: [table.dataSourceId],
			foreignColumns: [dataSources.id],
			name: "stored_values_sync_jobs_data_source_id_fkey"
		}).onDelete("cascade"),
	}
});

export const metricFiles = pgTable("metric_files", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar().notNull(),
	fileName: varchar("file_name").notNull(),
	content: jsonb().notNull(),
	verification: verificationEnum().default('notRequested').notNull(),
	evaluationObj: jsonb("evaluation_obj"),
	evaluationSummary: text("evaluation_summary"),
	evaluationScore: doublePrecision("evaluation_score"),
	organizationId: uuid("organization_id").notNull(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	publiclyAccessible: boolean("publicly_accessible").default(false).notNull(),
	publiclyEnabledBy: uuid("publicly_enabled_by"),
	publicExpiryDate: timestamp("public_expiry_date", { withTimezone: true, mode: 'string' }),
	versionHistory: jsonb("version_history").default({}).notNull(),
	dataMetadata: jsonb("data_metadata"),
	publicPassword: text("public_password"),
	dataSourceId: uuid("data_source_id").notNull(),
}, (table) => {
	return {
		createdByIdx: index("metric_files_created_by_idx").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")),
		dataMetadataIdx: index("metric_files_data_metadata_idx").using("gin", table.dataMetadata.asc().nullsLast().op("jsonb_ops")),
		deletedAtIdx: index("metric_files_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
		organizationIdIdx: index("metric_files_organization_id_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
		metricFilesCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "metric_files_created_by_fkey"
		}).onUpdate("cascade"),
		metricFilesPubliclyEnabledByFkey: foreignKey({
			columns: [table.publiclyEnabledBy],
			foreignColumns: [users.id],
			name: "metric_files_publicly_enabled_by_fkey"
		}).onUpdate("cascade"),
		fkDataSource: foreignKey({
			columns: [table.dataSourceId],
			foreignColumns: [dataSources.id],
			name: "fk_data_source"
		}),
	}
});

export const permissionGroupsToUsers = pgTable("permission_groups_to_users", {
	permissionGroupId: uuid("permission_group_id").notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		userIdIdx: index("permission_groups_to_users_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
		permissionGroupsToUsersPermissionGroupIdFkey: foreignKey({
			columns: [table.permissionGroupId],
			foreignColumns: [permissionGroups.id],
			name: "permission_groups_to_users_permission_group_id_fkey"
		}).onDelete("cascade"),
		permissionGroupsToUsersUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "permission_groups_to_users_user_id_fkey"
		}).onUpdate("cascade"),
		permissionGroupsToUsersPkey: primaryKey({ columns: [table.permissionGroupId, table.userId], name: "permission_groups_to_users_pkey"}),
		permissionGroupsToUsersPolicy: pgPolicy("permission_groups_to_users_policy", { as: "permissive", for: "all", to: ["authenticated"], using: sql`true` }),
	}
});

export const entityRelationship = pgTable("entity_relationship", {
	primaryDatasetId: uuid("primary_dataset_id").notNull(),
	foreignDatasetId: uuid("foreign_dataset_id").notNull(),
	relationshipType: text("relationship_type").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		entityRelationshipPkey: primaryKey({ columns: [table.primaryDatasetId, table.foreignDatasetId], name: "entity_relationship_pkey"}),
	}
});

export const metricFilesToDatasets = pgTable("metric_files_to_datasets", {
	metricFileId: uuid("metric_file_id").notNull(),
	datasetId: uuid("dataset_id").notNull(),
	metricVersionNumber: integer("metric_version_number").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		fkMetricFile: foreignKey({
			columns: [table.metricFileId],
			foreignColumns: [metricFiles.id],
			name: "fk_metric_file"
		}).onDelete("cascade"),
		fkDataset: foreignKey({
			columns: [table.datasetId],
			foreignColumns: [datasets.id],
			name: "fk_dataset"
		}).onDelete("cascade"),
		metricFilesToDatasetsPkey: primaryKey({ columns: [table.metricFileId, table.datasetId, table.metricVersionNumber], name: "metric_files_to_datasets_pkey"}),
	}
});

export const termsToDatasets = pgTable("terms_to_datasets", {
	termId: uuid("term_id").notNull(),
	datasetId: uuid("dataset_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => {
	return {
		termsToDatasetsTermIdFkey: foreignKey({
			columns: [table.termId],
			foreignColumns: [terms.id],
			name: "terms_to_datasets_term_id_fkey"
		}).onDelete("cascade"),
		termsToDatasetsDatasetIdFkey: foreignKey({
			columns: [table.datasetId],
			foreignColumns: [datasets.id],
			name: "terms_to_datasets_dataset_id_fkey"
		}).onDelete("cascade"),
		termsToDatasetsPkey: primaryKey({ columns: [table.termId, table.datasetId], name: "terms_to_datasets_pkey"}),
	}
});

export const datasetsToPermissionGroups = pgTable("datasets_to_permission_groups", {
	datasetId: uuid("dataset_id").notNull(),
	permissionGroupId: uuid("permission_group_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => {
	return {
		datasetsToPermissionGroupsDatasetIdFkey: foreignKey({
			columns: [table.datasetId],
			foreignColumns: [datasets.id],
			name: "datasets_to_permission_groups_dataset_id_fkey"
		}).onDelete("cascade"),
		datasetsToPermissionGroupsPermissionGroupIdFkey: foreignKey({
			columns: [table.permissionGroupId],
			foreignColumns: [permissionGroups.id],
			name: "datasets_to_permission_groups_permission_group_id_fkey"
		}).onDelete("cascade"),
		datasetsToPermissionGroupsPkey: primaryKey({ columns: [table.datasetId, table.permissionGroupId], name: "datasets_to_permission_groups_pkey"}),
		datasetsToPermissionGroupsPolicy: pgPolicy("datasets_to_permission_groups_policy", { as: "permissive", for: "all", to: ["authenticated"], using: sql`true` }),
	}
});

export const datasetsToDatasetGroups = pgTable("datasets_to_dataset_groups", {
	datasetId: uuid("dataset_id").notNull(),
	datasetGroupId: uuid("dataset_group_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => {
	return {
		datasetGroupIdIdx: index("datasets_to_dataset_groups_dataset_group_id_idx").using("btree", table.datasetGroupId.asc().nullsLast().op("uuid_ops")),
		datasetsToDatasetGroupsDatasetIdFkey: foreignKey({
			columns: [table.datasetId],
			foreignColumns: [datasets.id],
			name: "datasets_to_dataset_groups_dataset_id_fkey"
		}).onDelete("cascade"),
		datasetsToDatasetGroupsDatasetGroupIdFkey: foreignKey({
			columns: [table.datasetGroupId],
			foreignColumns: [datasetGroups.id],
			name: "datasets_to_dataset_groups_dataset_group_id_fkey"
		}).onDelete("cascade"),
		datasetsToDatasetGroupsPkey: primaryKey({ columns: [table.datasetId, table.datasetGroupId], name: "datasets_to_dataset_groups_pkey"}),
		datasetsToDatasetGroupsPolicy: pgPolicy("datasets_to_dataset_groups_policy", { as: "permissive", for: "all", to: ["authenticated"], using: sql`true` }),
	}
});

export const threadsToDashboards = pgTable("threads_to_dashboards", {
	threadId: uuid("thread_id").notNull(),
	dashboardId: uuid("dashboard_id").notNull(),
	addedBy: uuid("added_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => {
	return {
		threadsToDashboardsThreadIdFkey: foreignKey({
			columns: [table.threadId],
			foreignColumns: [threadsDeprecated.id],
			name: "threads_to_dashboards_thread_id_fkey"
		}).onDelete("cascade"),
		threadsToDashboardsDashboardIdFkey: foreignKey({
			columns: [table.dashboardId],
			foreignColumns: [dashboards.id],
			name: "threads_to_dashboards_dashboard_id_fkey"
		}).onDelete("cascade"),
		threadsToDashboardsAddedByFkey: foreignKey({
			columns: [table.addedBy],
			foreignColumns: [users.id],
			name: "threads_to_dashboards_added_by_fkey"
		}).onUpdate("cascade"),
		threadsToDashboardsPkey: primaryKey({ columns: [table.threadId, table.dashboardId], name: "threads_to_dashboards_pkey"}),
	}
});

export const userFavorites = pgTable("user_favorites", {
	userId: uuid("user_id").notNull(),
	assetId: uuid("asset_id").notNull(),
	assetType: assetTypeEnum("asset_type").notNull(),
	orderIndex: integer("order_index").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => {
	return {
		userFavoritesUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_favorites_user_id_fkey"
		}).onUpdate("cascade"),
		userFavoritesPkey: primaryKey({ columns: [table.userId, table.assetId, table.assetType], name: "user_favorites_pkey"}),
	}
});

export const teamsToUsers = pgTable("teams_to_users", {
	teamId: uuid("team_id").notNull(),
	userId: uuid("user_id").notNull(),
	role: teamRoleEnum().default('member').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => {
	return {
		teamsToUsersTeamIdFkey: foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "teams_to_users_team_id_fkey"
		}).onDelete("cascade"),
		teamsToUsersUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "teams_to_users_user_id_fkey"
		}).onUpdate("cascade"),
		teamsToUsersPkey: primaryKey({ columns: [table.teamId, table.userId], name: "teams_to_users_pkey"}),
	}
});

export const metricFilesToDashboardFiles = pgTable("metric_files_to_dashboard_files", {
	metricFileId: uuid("metric_file_id").notNull(),
	dashboardFileId: uuid("dashboard_file_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	createdBy: uuid("created_by").notNull(),
}, (table) => {
	return {
		dashboardIdIdx: index("metric_files_to_dashboard_files_dashboard_id_idx").using("btree", table.dashboardFileId.asc().nullsLast().op("uuid_ops")),
		deletedAtIdx: index("metric_files_to_dashboard_files_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
		metricIdIdx: index("metric_files_to_dashboard_files_metric_id_idx").using("btree", table.metricFileId.asc().nullsLast().op("uuid_ops")),
		metricFilesToDashboardFilesMetricFileIdFkey: foreignKey({
			columns: [table.metricFileId],
			foreignColumns: [metricFiles.id],
			name: "metric_files_to_dashboard_files_metric_file_id_fkey"
		}),
		metricFilesToDashboardFilesDashboardFileIdFkey: foreignKey({
			columns: [table.dashboardFileId],
			foreignColumns: [dashboardFiles.id],
			name: "metric_files_to_dashboard_files_dashboard_file_id_fkey"
		}),
		metricFilesToDashboardFilesCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "metric_files_to_dashboard_files_created_by_fkey"
		}).onUpdate("cascade"),
		metricFilesToDashboardFilesPkey: primaryKey({ columns: [table.metricFileId, table.dashboardFileId], name: "metric_files_to_dashboard_files_pkey"}),
	}
});

export const collectionsToAssets = pgTable("collections_to_assets", {
	collectionId: uuid("collection_id").notNull(),
	assetId: uuid("asset_id").notNull(),
	assetType: assetTypeEnum("asset_type").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by").notNull(),
}, (table) => {
	return {
		collectionsToAssetsCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "collections_to_assets_created_by_fkey"
		}).onUpdate("cascade"),
		collectionsToAssetsUpdatedByFkey: foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "collections_to_assets_updated_by_fkey"
		}).onUpdate("cascade"),
		collectionsToAssetsPkey: primaryKey({ columns: [table.collectionId, table.assetId, table.assetType], name: "collections_to_assets_pkey"}),
	}
});

export const permissionGroupsToIdentities = pgTable("permission_groups_to_identities", {
	permissionGroupId: uuid("permission_group_id").notNull(),
	identityId: uuid("identity_id").notNull(),
	identityType: identityTypeEnum("identity_type").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by").notNull(),
}, (table) => {
	return {
		permissionGroupsToIdentitiesCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "permission_groups_to_identities_created_by_fkey"
		}).onUpdate("cascade"),
		permissionGroupsToIdentitiesUpdatedByFkey: foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "permission_groups_to_identities_updated_by_fkey"
		}).onUpdate("cascade"),
		permissionGroupsToIdentitiesPkey: primaryKey({ columns: [table.permissionGroupId, table.identityId, table.identityType], name: "permission_groups_to_identities_pkey"}),
	}
});

export const assetPermissions = pgTable("asset_permissions", {
	identityId: uuid("identity_id").notNull(),
	identityType: identityTypeEnum("identity_type").notNull(),
	assetId: uuid("asset_id").notNull(),
	assetType: assetTypeEnum("asset_type").notNull(),
	role: assetPermissionRoleEnum().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by").notNull(),
}, (table) => {
	return {
		assetPermissionsCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "asset_permissions_created_by_fkey"
		}).onUpdate("cascade"),
		assetPermissionsUpdatedByFkey: foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "asset_permissions_updated_by_fkey"
		}).onUpdate("cascade"),
		assetPermissionsPkey: primaryKey({ columns: [table.identityId, table.identityType, table.assetId, table.assetType], name: "asset_permissions_pkey"}),
	}
});

export const usersToOrganizations = pgTable("users_to_organizations", {
	userId: uuid("user_id").notNull(),
	organizationId: uuid("organization_id").notNull(),
	role: userOrganizationRoleEnum().default('querier').notNull(),
	sharingSetting: sharingSettingEnum("sharing_setting").default('none').notNull(),
	editSql: boolean("edit_sql").default(false).notNull(),
	uploadCsv: boolean("upload_csv").default(false).notNull(),
	exportAssets: boolean("export_assets").default(false).notNull(),
	emailSlackEnabled: boolean("email_slack_enabled").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by").notNull(),
	deletedBy: uuid("deleted_by"),
	status: userOrganizationStatusEnum().default('active').notNull(),
}, (table) => {
	return {
		usersToOrganizationsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "users_to_organizations_organization_id_fkey"
		}).onDelete("cascade"),
		usersToOrganizationsUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "users_to_organizations_user_id_fkey"
		}).onUpdate("cascade"),
		usersToOrganizationsCreatedByFkey: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "users_to_organizations_created_by_fkey"
		}).onUpdate("cascade"),
		usersToOrganizationsUpdatedByFkey: foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "users_to_organizations_updated_by_fkey"
		}).onUpdate("cascade"),
		usersToOrganizationsDeletedByFkey: foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [users.id],
			name: "users_to_organizations_deleted_by_fkey"
		}).onUpdate("cascade"),
		usersToOrganizationsPkey: primaryKey({ columns: [table.userId, table.organizationId], name: "users_to_organizations_pkey"}),
	}
});

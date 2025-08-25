import { relations } from 'drizzle-orm/relations';
import {
  apiKeys,
  assetPermissions,
  chats,
  collections,
  collectionsToAssets,
  dashboardFiles,
  dashboardVersions,
  dashboards,
  dataSources,
  databaseMetadata,
  datasetGroups,
  datasetGroupsPermissions,
  datasetPermissions,
  datasets,
  datasetsToDatasetGroups,
  datasetsToPermissionGroups,
  messages,
  messagesDeprecated,
  messagesToFiles,
  metricFiles,
  metricFilesToDashboardFiles,
  metricFilesToDatasets,
  organizations,
  permissionGroups,
  permissionGroupsToIdentities,
  permissionGroupsToUsers,
  s3Integrations,
  schemaMetadata,
  storedValuesSyncJobs,
  tableMetadata,
  teams,
  teamsToUsers,
  terms,
  termsToDatasets,
  threadsDeprecated,
  threadsToDashboards,
  userFavorites,
  users,
  usersToOrganizations,
} from './schema';

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [apiKeys.ownerId],
    references: [users.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  apiKeys: many(apiKeys),
  teams: many(teams),
  permissionGroups: many(permissionGroups),
  terms: many(terms),
  collections: many(collections),
  dashboards: many(dashboards),
  dataSources: many(dataSources),
  datasetGroups: many(datasetGroups),
  datasetPermissions: many(datasetPermissions),
  datasetGroupsPermissions: many(datasetGroupsPermissions),
  threadsDeprecateds: many(threadsDeprecated),
  datasets: many(datasets),
  chats: many(chats),
  usersToOrganizations: many(usersToOrganizations),
  s3Integrations: many(s3Integrations),
}));

export const s3IntegrationsRelations = relations(s3Integrations, ({ one }) => ({
  organization: one(organizations, {
    fields: [s3Integrations.organizationId],
    references: [organizations.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  apiKeys: many(apiKeys),
  teams: many(teams),
  permissionGroups_createdBy: many(permissionGroups, {
    relationName: 'permissionGroups_createdBy_users_id',
  }),
  permissionGroups_updatedBy: many(permissionGroups, {
    relationName: 'permissionGroups_updatedBy_users_id',
  }),
  terms_createdBy: many(terms, {
    relationName: 'terms_createdBy_users_id',
  }),
  terms_updatedBy: many(terms, {
    relationName: 'terms_updatedBy_users_id',
  }),
  collections_createdBy: many(collections, {
    relationName: 'collections_createdBy_users_id',
  }),
  collections_updatedBy: many(collections, {
    relationName: 'collections_updatedBy_users_id',
  }),
  dashboards_publiclyEnabledBy: many(dashboards, {
    relationName: 'dashboards_publiclyEnabledBy_users_id',
  }),
  dashboards_createdBy: many(dashboards, {
    relationName: 'dashboards_createdBy_users_id',
  }),
  dashboards_updatedBy: many(dashboards, {
    relationName: 'dashboards_updatedBy_users_id',
  }),
  dataSources_createdBy: many(dataSources, {
    relationName: 'dataSources_createdBy_users_id',
  }),
  dataSources_updatedBy: many(dataSources, {
    relationName: 'dataSources_updatedBy_users_id',
  }),
  threadsDeprecateds_createdBy: many(threadsDeprecated, {
    relationName: 'threadsDeprecated_createdBy_users_id',
  }),
  threadsDeprecateds_updatedBy: many(threadsDeprecated, {
    relationName: 'threadsDeprecated_updatedBy_users_id',
  }),
  threadsDeprecateds_publiclyEnabledBy: many(threadsDeprecated, {
    relationName: 'threadsDeprecated_publiclyEnabledBy_users_id',
  }),
  messagesDeprecateds_sentBy: many(messagesDeprecated, {
    relationName: 'messagesDeprecated_sentBy_users_id',
  }),
  datasets_createdBy: many(datasets, {
    relationName: 'datasets_createdBy_users_id',
  }),
  datasets_updatedBy: many(datasets, {
    relationName: 'datasets_updatedBy_users_id',
  }),
  messages: many(messages),
  dashboardFiles_createdBy: many(dashboardFiles, {
    relationName: 'dashboardFiles_createdBy_users_id',
  }),
  dashboardFiles_publiclyEnabledBy: many(dashboardFiles, {
    relationName: 'dashboardFiles_publiclyEnabledBy_users_id',
  }),
  chats_createdBy: many(chats, {
    relationName: 'chats_createdBy_users_id',
  }),
  chats_updatedBy: many(chats, {
    relationName: 'chats_updatedBy_users_id',
  }),
  chats_publiclyEnabledBy: many(chats, {
    relationName: 'chats_publiclyEnabledBy_users_id',
  }),
  metricFiles_createdBy: many(metricFiles, {
    relationName: 'metricFiles_createdBy_users_id',
  }),
  metricFiles_publiclyEnabledBy: many(metricFiles, {
    relationName: 'metricFiles_publiclyEnabledBy_users_id',
  }),
  permissionGroupsToUsers: many(permissionGroupsToUsers),
  threadsToDashboards: many(threadsToDashboards),
  userFavorites: many(userFavorites),
  teamsToUsers: many(teamsToUsers),
  metricFilesToDashboardFiles: many(metricFilesToDashboardFiles),
  collectionsToAssets_createdBy: many(collectionsToAssets, {
    relationName: 'collectionsToAssets_createdBy_users_id',
  }),
  collectionsToAssets_updatedBy: many(collectionsToAssets, {
    relationName: 'collectionsToAssets_updatedBy_users_id',
  }),
  permissionGroupsToIdentities_createdBy: many(permissionGroupsToIdentities, {
    relationName: 'permissionGroupsToIdentities_createdBy_users_id',
  }),
  permissionGroupsToIdentities_updatedBy: many(permissionGroupsToIdentities, {
    relationName: 'permissionGroupsToIdentities_updatedBy_users_id',
  }),
  assetPermissions_createdBy: many(assetPermissions, {
    relationName: 'assetPermissions_createdBy_users_id',
  }),
  assetPermissions_updatedBy: many(assetPermissions, {
    relationName: 'assetPermissions_updatedBy_users_id',
  }),
  usersToOrganizations_userId: many(usersToOrganizations, {
    relationName: 'usersToOrganizations_userId_users_id',
  }),
  usersToOrganizations_createdBy: many(usersToOrganizations, {
    relationName: 'usersToOrganizations_createdBy_users_id',
  }),
  usersToOrganizations_updatedBy: many(usersToOrganizations, {
    relationName: 'usersToOrganizations_updatedBy_users_id',
  }),
  usersToOrganizations_deletedBy: many(usersToOrganizations, {
    relationName: 'usersToOrganizations_deletedBy_users_id',
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [teams.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [teams.createdBy],
    references: [users.id],
  }),
  teamsToUsers: many(teamsToUsers),
}));

export const permissionGroupsRelations = relations(permissionGroups, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [permissionGroups.organizationId],
    references: [organizations.id],
  }),
  user_createdBy: one(users, {
    fields: [permissionGroups.createdBy],
    references: [users.id],
    relationName: 'permissionGroups_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [permissionGroups.updatedBy],
    references: [users.id],
    relationName: 'permissionGroups_updatedBy_users_id',
  }),
  permissionGroupsToUsers: many(permissionGroupsToUsers),
  datasetsToPermissionGroups: many(datasetsToPermissionGroups),
}));

export const termsRelations = relations(terms, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [terms.organizationId],
    references: [organizations.id],
  }),
  user_createdBy: one(users, {
    fields: [terms.createdBy],
    references: [users.id],
    relationName: 'terms_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [terms.updatedBy],
    references: [users.id],
    relationName: 'terms_updatedBy_users_id',
  }),
  termsToDatasets: many(termsToDatasets),
}));

export const collectionsRelations = relations(collections, ({ one }) => ({
  organization: one(organizations, {
    fields: [collections.organizationId],
    references: [organizations.id],
  }),
  user_createdBy: one(users, {
    fields: [collections.createdBy],
    references: [users.id],
    relationName: 'collections_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [collections.updatedBy],
    references: [users.id],
    relationName: 'collections_updatedBy_users_id',
  }),
}));

export const dashboardsRelations = relations(dashboards, ({ one, many }) => ({
  user_publiclyEnabledBy: one(users, {
    fields: [dashboards.publiclyEnabledBy],
    references: [users.id],
    relationName: 'dashboards_publiclyEnabledBy_users_id',
  }),
  organization: one(organizations, {
    fields: [dashboards.organizationId],
    references: [organizations.id],
  }),
  user_createdBy: one(users, {
    fields: [dashboards.createdBy],
    references: [users.id],
    relationName: 'dashboards_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [dashboards.updatedBy],
    references: [users.id],
    relationName: 'dashboards_updatedBy_users_id',
  }),
  dashboardVersions: many(dashboardVersions),
  threadsToDashboards: many(threadsToDashboards),
}));

export const dashboardVersionsRelations = relations(dashboardVersions, ({ one }) => ({
  dashboard: one(dashboards, {
    fields: [dashboardVersions.dashboardId],
    references: [dashboards.id],
  }),
}));

export const dataSourcesRelations = relations(dataSources, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [dataSources.organizationId],
    references: [organizations.id],
  }),
  user_createdBy: one(users, {
    fields: [dataSources.createdBy],
    references: [users.id],
    relationName: 'dataSources_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [dataSources.updatedBy],
    references: [users.id],
    relationName: 'dataSources_updatedBy_users_id',
  }),
  datasets: many(datasets),
  storedValuesSyncJobs: many(storedValuesSyncJobs),
  metricFiles: many(metricFiles),
  databaseMetadata: many(databaseMetadata),
  schemaMetadata: many(schemaMetadata),
  tableMetadata: many(tableMetadata),
}));

export const datasetGroupsRelations = relations(datasetGroups, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [datasetGroups.organizationId],
    references: [organizations.id],
  }),
  datasetGroupsPermissions: many(datasetGroupsPermissions),
  datasetsToDatasetGroups: many(datasetsToDatasetGroups),
}));

export const datasetPermissionsRelations = relations(datasetPermissions, ({ one }) => ({
  organization: one(organizations, {
    fields: [datasetPermissions.organizationId],
    references: [organizations.id],
  }),
  dataset: one(datasets, {
    fields: [datasetPermissions.datasetId],
    references: [datasets.id],
  }),
}));

export const datasetsRelations = relations(datasets, ({ one, many }) => ({
  datasetPermissions: many(datasetPermissions),
  messagesDeprecateds: many(messagesDeprecated),
  dataSource: one(dataSources, {
    fields: [datasets.dataSourceId],
    references: [dataSources.id],
  }),
  organization: one(organizations, {
    fields: [datasets.organizationId],
    references: [organizations.id],
  }),
  user_createdBy: one(users, {
    fields: [datasets.createdBy],
    references: [users.id],
    relationName: 'datasets_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [datasets.updatedBy],
    references: [users.id],
    relationName: 'datasets_updatedBy_users_id',
  }),
  metricFilesToDatasets: many(metricFilesToDatasets),
  termsToDatasets: many(termsToDatasets),
  datasetsToPermissionGroups: many(datasetsToPermissionGroups),
  datasetsToDatasetGroups: many(datasetsToDatasetGroups),
}));

export const datasetGroupsPermissionsRelations = relations(datasetGroupsPermissions, ({ one }) => ({
  datasetGroup: one(datasetGroups, {
    fields: [datasetGroupsPermissions.datasetGroupId],
    references: [datasetGroups.id],
  }),
  organization: one(organizations, {
    fields: [datasetGroupsPermissions.organizationId],
    references: [organizations.id],
  }),
}));

export const threadsDeprecatedRelations = relations(threadsDeprecated, ({ one, many }) => ({
  user_createdBy: one(users, {
    fields: [threadsDeprecated.createdBy],
    references: [users.id],
    relationName: 'threadsDeprecated_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [threadsDeprecated.updatedBy],
    references: [users.id],
    relationName: 'threadsDeprecated_updatedBy_users_id',
  }),
  user_publiclyEnabledBy: one(users, {
    fields: [threadsDeprecated.publiclyEnabledBy],
    references: [users.id],
    relationName: 'threadsDeprecated_publiclyEnabledBy_users_id',
  }),
  threadsDeprecated: one(threadsDeprecated, {
    fields: [threadsDeprecated.parentThreadId],
    references: [threadsDeprecated.id],
    relationName: 'threadsDeprecated_parentThreadId_threadsDeprecated_id',
  }),
  threadsDeprecateds: many(threadsDeprecated, {
    relationName: 'threadsDeprecated_parentThreadId_threadsDeprecated_id',
  }),
  organization: one(organizations, {
    fields: [threadsDeprecated.organizationId],
    references: [organizations.id],
  }),
  threadsToDashboards: many(threadsToDashboards),
}));

export const messagesDeprecatedRelations = relations(messagesDeprecated, ({ one }) => ({
  user_sentBy: one(users, {
    fields: [messagesDeprecated.sentBy],
    references: [users.id],
    relationName: 'messagesDeprecated_sentBy_users_id',
  }),
  dataset: one(datasets, {
    fields: [messagesDeprecated.datasetId],
    references: [datasets.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  user: one(users, {
    fields: [messages.createdBy],
    references: [users.id],
  }),
  messagesToFiles: many(messagesToFiles),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  messages: many(messages),
  organization: one(organizations, {
    fields: [chats.organizationId],
    references: [organizations.id],
  }),
  user_createdBy: one(users, {
    fields: [chats.createdBy],
    references: [users.id],
    relationName: 'chats_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [chats.updatedBy],
    references: [users.id],
    relationName: 'chats_updatedBy_users_id',
  }),
  user_publiclyEnabledBy: one(users, {
    fields: [chats.publiclyEnabledBy],
    references: [users.id],
    relationName: 'chats_publiclyEnabledBy_users_id',
  }),
}));

export const messagesToFilesRelations = relations(messagesToFiles, ({ one }) => ({
  message: one(messages, {
    fields: [messagesToFiles.messageId],
    references: [messages.id],
  }),
}));

export const dashboardFilesRelations = relations(dashboardFiles, ({ one, many }) => ({
  user_createdBy: one(users, {
    fields: [dashboardFiles.createdBy],
    references: [users.id],
    relationName: 'dashboardFiles_createdBy_users_id',
  }),
  user_publiclyEnabledBy: one(users, {
    fields: [dashboardFiles.publiclyEnabledBy],
    references: [users.id],
    relationName: 'dashboardFiles_publiclyEnabledBy_users_id',
  }),
  metricFilesToDashboardFiles: many(metricFilesToDashboardFiles),
}));

export const storedValuesSyncJobsRelations = relations(storedValuesSyncJobs, ({ one }) => ({
  dataSource: one(dataSources, {
    fields: [storedValuesSyncJobs.dataSourceId],
    references: [dataSources.id],
  }),
}));

export const metricFilesRelations = relations(metricFiles, ({ one, many }) => ({
  user_createdBy: one(users, {
    fields: [metricFiles.createdBy],
    references: [users.id],
    relationName: 'metricFiles_createdBy_users_id',
  }),
  user_publiclyEnabledBy: one(users, {
    fields: [metricFiles.publiclyEnabledBy],
    references: [users.id],
    relationName: 'metricFiles_publiclyEnabledBy_users_id',
  }),
  dataSource: one(dataSources, {
    fields: [metricFiles.dataSourceId],
    references: [dataSources.id],
  }),
  metricFilesToDatasets: many(metricFilesToDatasets),
  metricFilesToDashboardFiles: many(metricFilesToDashboardFiles),
}));

export const permissionGroupsToUsersRelations = relations(permissionGroupsToUsers, ({ one }) => ({
  permissionGroup: one(permissionGroups, {
    fields: [permissionGroupsToUsers.permissionGroupId],
    references: [permissionGroups.id],
  }),
  user: one(users, {
    fields: [permissionGroupsToUsers.userId],
    references: [users.id],
  }),
}));

export const metricFilesToDatasetsRelations = relations(metricFilesToDatasets, ({ one }) => ({
  metricFile: one(metricFiles, {
    fields: [metricFilesToDatasets.metricFileId],
    references: [metricFiles.id],
  }),
  dataset: one(datasets, {
    fields: [metricFilesToDatasets.datasetId],
    references: [datasets.id],
  }),
}));

export const termsToDatasetsRelations = relations(termsToDatasets, ({ one }) => ({
  term: one(terms, {
    fields: [termsToDatasets.termId],
    references: [terms.id],
  }),
  dataset: one(datasets, {
    fields: [termsToDatasets.datasetId],
    references: [datasets.id],
  }),
}));

export const datasetsToPermissionGroupsRelations = relations(
  datasetsToPermissionGroups,
  ({ one }) => ({
    dataset: one(datasets, {
      fields: [datasetsToPermissionGroups.datasetId],
      references: [datasets.id],
    }),
    permissionGroup: one(permissionGroups, {
      fields: [datasetsToPermissionGroups.permissionGroupId],
      references: [permissionGroups.id],
    }),
  })
);

export const datasetsToDatasetGroupsRelations = relations(datasetsToDatasetGroups, ({ one }) => ({
  dataset: one(datasets, {
    fields: [datasetsToDatasetGroups.datasetId],
    references: [datasets.id],
  }),
  datasetGroup: one(datasetGroups, {
    fields: [datasetsToDatasetGroups.datasetGroupId],
    references: [datasetGroups.id],
  }),
}));

export const threadsToDashboardsRelations = relations(threadsToDashboards, ({ one }) => ({
  threadsDeprecated: one(threadsDeprecated, {
    fields: [threadsToDashboards.threadId],
    references: [threadsDeprecated.id],
  }),
  dashboard: one(dashboards, {
    fields: [threadsToDashboards.dashboardId],
    references: [dashboards.id],
  }),
  user: one(users, {
    fields: [threadsToDashboards.addedBy],
    references: [users.id],
  }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
}));

export const teamsToUsersRelations = relations(teamsToUsers, ({ one }) => ({
  team: one(teams, {
    fields: [teamsToUsers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamsToUsers.userId],
    references: [users.id],
  }),
}));

export const metricFilesToDashboardFilesRelations = relations(
  metricFilesToDashboardFiles,
  ({ one }) => ({
    metricFile: one(metricFiles, {
      fields: [metricFilesToDashboardFiles.metricFileId],
      references: [metricFiles.id],
    }),
    dashboardFile: one(dashboardFiles, {
      fields: [metricFilesToDashboardFiles.dashboardFileId],
      references: [dashboardFiles.id],
    }),
    user: one(users, {
      fields: [metricFilesToDashboardFiles.createdBy],
      references: [users.id],
    }),
  })
);

export const collectionsToAssetsRelations = relations(collectionsToAssets, ({ one }) => ({
  user_createdBy: one(users, {
    fields: [collectionsToAssets.createdBy],
    references: [users.id],
    relationName: 'collectionsToAssets_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [collectionsToAssets.updatedBy],
    references: [users.id],
    relationName: 'collectionsToAssets_updatedBy_users_id',
  }),
}));

export const permissionGroupsToIdentitiesRelations = relations(
  permissionGroupsToIdentities,
  ({ one }) => ({
    user_createdBy: one(users, {
      fields: [permissionGroupsToIdentities.createdBy],
      references: [users.id],
      relationName: 'permissionGroupsToIdentities_createdBy_users_id',
    }),
    user_updatedBy: one(users, {
      fields: [permissionGroupsToIdentities.updatedBy],
      references: [users.id],
      relationName: 'permissionGroupsToIdentities_updatedBy_users_id',
    }),
  })
);

export const assetPermissionsRelations = relations(assetPermissions, ({ one }) => ({
  user_createdBy: one(users, {
    fields: [assetPermissions.createdBy],
    references: [users.id],
    relationName: 'assetPermissions_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [assetPermissions.updatedBy],
    references: [users.id],
    relationName: 'assetPermissions_updatedBy_users_id',
  }),
}));

export const usersToOrganizationsRelations = relations(usersToOrganizations, ({ one }) => ({
  organization: one(organizations, {
    fields: [usersToOrganizations.organizationId],
    references: [organizations.id],
  }),
  user_userId: one(users, {
    fields: [usersToOrganizations.userId],
    references: [users.id],
    relationName: 'usersToOrganizations_userId_users_id',
  }),
  user_createdBy: one(users, {
    fields: [usersToOrganizations.createdBy],
    references: [users.id],
    relationName: 'usersToOrganizations_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [usersToOrganizations.updatedBy],
    references: [users.id],
    relationName: 'usersToOrganizations_updatedBy_users_id',
  }),
  user_deletedBy: one(users, {
    fields: [usersToOrganizations.deletedBy],
    references: [users.id],
    relationName: 'usersToOrganizations_deletedBy_users_id',
  }),
}));

export const databaseMetadataRelations = relations(databaseMetadata, ({ one, many }) => ({
  dataSource: one(dataSources, {
    fields: [databaseMetadata.dataSourceId],
    references: [dataSources.id],
  }),
  schemaMetadata: many(schemaMetadata),
  tableMetadata: many(tableMetadata),
}));

export const schemaMetadataRelations = relations(schemaMetadata, ({ one, many }) => ({
  dataSource: one(dataSources, {
    fields: [schemaMetadata.dataSourceId],
    references: [dataSources.id],
  }),
  databaseMetadata: one(databaseMetadata, {
    fields: [schemaMetadata.databaseId],
    references: [databaseMetadata.id],
  }),
  tableMetadata: many(tableMetadata),
}));

export const tableMetadataRelations = relations(tableMetadata, ({ one }) => ({
  dataSource: one(dataSources, {
    fields: [tableMetadata.dataSourceId],
    references: [dataSources.id],
  }),
  databaseMetadata: one(databaseMetadata, {
    fields: [tableMetadata.databaseId],
    references: [databaseMetadata.id],
  }),
  schemaMetadata: one(schemaMetadata, {
    fields: [tableMetadata.schemaId],
    references: [schemaMetadata.id],
  }),
}));

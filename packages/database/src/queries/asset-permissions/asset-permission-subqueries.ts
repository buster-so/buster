import { and, eq, exists, isNull, ne, or, sql } from 'drizzle-orm';
import { db } from '../../connection';
import {
  assetPermissions,
  chats,
  collections,
  collectionsToAssets,
  dashboardFiles,
  messages,
  messagesToFiles,
  metricFiles,
  metricFilesToDashboardFiles,
  metricFilesToReportFiles,
  reportFiles,
} from '../../schema';

export const permissionedReportFiles = (organizationId: string, userId: string) =>
  db
    .select({
      assetId: reportFiles.id,
      assetType: sql`'report_file'::asset_type_enum`.as('assetType'),
      name: reportFiles.name,
      createdAt: reportFiles.createdAt,
      updatedAt: reportFiles.updatedAt,
      createdBy: reportFiles.createdBy,
      organizationId: reportFiles.organizationId,
      screenshotBucketKey: reportFiles.screenshotBucketKey,
    })
    .from(reportFiles)
    .where(
      and(
        eq(reportFiles.organizationId, organizationId),
        isNull(reportFiles.deletedAt),
        or(
          ne(reportFiles.workspaceSharing, 'none'),
          exists(
            db
              .select({ value: sql`1` })
              .from(assetPermissions)
              .where(
                and(
                  eq(assetPermissions.assetId, reportFiles.id),
                  eq(assetPermissions.assetType, 'report_file'),
                  eq(assetPermissions.identityId, userId),
                  eq(assetPermissions.identityType, 'user'),
                  isNull(assetPermissions.deletedAt)
                )
              )
          )
        )
      )
    );

export const permissionedMetricFiles = (organizationId: string, userId: string) =>
  db
    .select({
      assetId: metricFiles.id,
      assetType: sql`'metric_file'::asset_type_enum`.as('assetType'),
      name: metricFiles.name,
      createdAt: metricFiles.createdAt,
      updatedAt: metricFiles.updatedAt,
      createdBy: metricFiles.createdBy,
      organizationId: metricFiles.organizationId,
      screenshotBucketKey: metricFiles.screenshotBucketKey,
    })
    .from(metricFiles)
    .where(
      and(
        eq(metricFiles.organizationId, organizationId),
        isNull(metricFiles.deletedAt),
        or(
          ne(metricFiles.workspaceSharing, 'none'),
          exists(
            db
              .select({ value: sql`1` })
              .from(assetPermissions)
              .where(
                and(
                  eq(assetPermissions.assetId, metricFiles.id),
                  eq(assetPermissions.assetType, 'metric_file'),
                  eq(assetPermissions.identityId, userId),
                  eq(assetPermissions.identityType, 'user'),
                  isNull(assetPermissions.deletedAt)
                )
              )
          )
        )
      )
    );

export const permissionedDashboardFiles = (organizationId: string, userId: string) =>
  db
    .select({
      assetId: dashboardFiles.id,
      assetType: sql`'dashboard_file'::asset_type_enum`.as('assetType'),
      name: dashboardFiles.name,
      createdAt: dashboardFiles.createdAt,
      updatedAt: dashboardFiles.updatedAt,
      createdBy: dashboardFiles.createdBy,
      organizationId: dashboardFiles.organizationId,
      screenshotBucketKey: dashboardFiles.screenshotBucketKey,
    })
    .from(dashboardFiles)
    .where(
      and(
        eq(dashboardFiles.organizationId, organizationId),
        isNull(dashboardFiles.deletedAt),
        or(
          ne(dashboardFiles.workspaceSharing, 'none'),
          exists(
            db
              .select({ value: sql`1` })
              .from(assetPermissions)
              .where(
                and(
                  eq(assetPermissions.assetId, dashboardFiles.id),
                  eq(assetPermissions.assetType, 'dashboard_file'),
                  eq(assetPermissions.identityId, userId),
                  eq(assetPermissions.identityType, 'user'),
                  isNull(assetPermissions.deletedAt)
                )
              )
          )
        )
      )
    );

export const permissionedChats = (organizationId: string, userId: string) =>
  db
    .select({
      assetId: chats.id,
      assetType: sql`'chat'::asset_type_enum`.as('assetType'),
      name: chats.title,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
      createdBy: chats.createdBy,
      organizationId: chats.organizationId,
      screenshotBucketKey: chats.screenshotBucketKey,
    })
    .from(chats)
    .where(
      and(
        eq(chats.organizationId, organizationId),
        isNull(chats.deletedAt),
        or(
          ne(chats.workspaceSharing, 'none'),
          exists(
            db
              .select({ value: sql`1` })
              .from(assetPermissions)
              .where(
                and(
                  eq(assetPermissions.assetId, chats.id),
                  eq(assetPermissions.assetType, 'chat'),
                  eq(assetPermissions.identityId, userId),
                  eq(assetPermissions.identityType, 'user'),
                  isNull(assetPermissions.deletedAt)
                )
              )
          )
        )
      )
    );

export const permissionedCollections = (organizationId: string, userId: string) =>
  db
    .select({
      assetId: collections.id,
      assetType: sql`'collection'::asset_type_enum`.as('assetType'),
      name: collections.name,
      createdAt: collections.createdAt,
      updatedAt: collections.updatedAt,
      createdBy: collections.createdBy,
      organizationId: collections.organizationId,
      screenshotBucketKey: collections.screenshotBucketKey,
    })
    .from(collections)
    .where(
      and(
        eq(collections.organizationId, organizationId),
        isNull(collections.deletedAt),
        or(
          ne(collections.workspaceSharing, 'none'),
          exists(
            db
              .select({ value: sql`1` })
              .from(assetPermissions)
              .where(
                and(
                  eq(assetPermissions.assetId, collections.id),
                  eq(assetPermissions.assetType, 'collection'),
                  eq(assetPermissions.identityId, userId),
                  eq(assetPermissions.identityType, 'user'),
                  isNull(assetPermissions.deletedAt)
                )
              )
          )
        )
      )
    );

// Child metric files from dashboard files (when includeAssetChildren is true)
export const childMetricsFromDashboards = (organizationId: string, userId: string) =>
  db
    .select({
      assetId: metricFiles.id,
      assetType: sql`'metric_file'::asset_type_enum`.as('assetType'),
      name: metricFiles.name,
      createdAt: metricFiles.createdAt,
      updatedAt: metricFiles.updatedAt,
      createdBy: metricFiles.createdBy,
      organizationId: metricFiles.organizationId,
      screenshotBucketKey: metricFiles.screenshotBucketKey,
    })
    .from(metricFiles)
    .innerJoin(
      metricFilesToDashboardFiles,
      and(
        eq(metricFilesToDashboardFiles.metricFileId, metricFiles.id),
        isNull(metricFilesToDashboardFiles.deletedAt)
      )
    )
    .innerJoin(dashboardFiles, eq(dashboardFiles.id, metricFilesToDashboardFiles.dashboardFileId))
    .where(
      and(
        eq(metricFiles.organizationId, organizationId),
        isNull(metricFiles.deletedAt),
        isNull(dashboardFiles.deletedAt),
        or(
          ne(dashboardFiles.workspaceSharing, 'none'),
          exists(
            db
              .select({ value: sql`1` })
              .from(assetPermissions)
              .where(
                and(
                  eq(assetPermissions.assetId, dashboardFiles.id),
                  eq(assetPermissions.assetType, 'dashboard_file'),
                  eq(assetPermissions.identityId, userId),
                  eq(assetPermissions.identityType, 'user'),
                  isNull(assetPermissions.deletedAt)
                )
              )
          )
        )
      )
    );

// Child metric files from report files (when includeAssetChildren is true)
export const childMetricsFromReports = (organizationId: string, userId: string) =>
  db
    .select({
      assetId: metricFiles.id,
      assetType: sql`'metric_file'::asset_type_enum`.as('assetType'),
      name: metricFiles.name,
      createdAt: metricFiles.createdAt,
      updatedAt: metricFiles.updatedAt,
      createdBy: metricFiles.createdBy,
      organizationId: metricFiles.organizationId,
      screenshotBucketKey: metricFiles.screenshotBucketKey,
    })
    .from(metricFiles)
    .innerJoin(
      metricFilesToReportFiles,
      and(
        eq(metricFilesToReportFiles.metricFileId, metricFiles.id),
        isNull(metricFilesToReportFiles.deletedAt)
      )
    )
    .innerJoin(reportFiles, eq(reportFiles.id, metricFilesToReportFiles.reportFileId))
    .where(
      and(
        eq(metricFiles.organizationId, organizationId),
        isNull(metricFiles.deletedAt),
        isNull(reportFiles.deletedAt),
        or(
          ne(reportFiles.workspaceSharing, 'none'),
          exists(
            db
              .select({ value: sql`1` })
              .from(assetPermissions)
              .where(
                and(
                  eq(assetPermissions.assetId, reportFiles.id),
                  eq(assetPermissions.assetType, 'report_file'),
                  eq(assetPermissions.identityId, userId),
                  eq(assetPermissions.identityType, 'user'),
                  isNull(assetPermissions.deletedAt)
                )
              )
          )
        )
      )
    );

// Child metric files from chat messages (when includeAssetChildren is true)
export const childMetricsFromChats = (organizationId: string, userId: string) =>
  db
    .select({
      assetId: metricFiles.id,
      assetType: sql`'metric_file'::asset_type_enum`.as('assetType'),
      name: metricFiles.name,
      createdAt: metricFiles.createdAt,
      updatedAt: metricFiles.updatedAt,
      createdBy: metricFiles.createdBy,
      organizationId: metricFiles.organizationId,
      screenshotBucketKey: metricFiles.screenshotBucketKey,
    })
    .from(metricFiles)
    .innerJoin(
      messagesToFiles,
      and(
        eq(messagesToFiles.fileId, metricFiles.id),
        isNull(messagesToFiles.deletedAt),
        eq(messagesToFiles.isDuplicate, false)
      )
    )
    .innerJoin(messages, eq(messages.id, messagesToFiles.messageId))
    .innerJoin(chats, eq(chats.id, messages.chatId))
    .where(
      and(
        eq(metricFiles.organizationId, organizationId),
        isNull(metricFiles.deletedAt),
        isNull(messages.deletedAt),
        isNull(chats.deletedAt),
        or(
          ne(chats.workspaceSharing, 'none'),
          exists(
            db
              .select({ value: sql`1` })
              .from(assetPermissions)
              .where(
                and(
                  eq(assetPermissions.assetId, chats.id),
                  eq(assetPermissions.assetType, 'chat'),
                  eq(assetPermissions.identityId, userId),
                  eq(assetPermissions.identityType, 'user'),
                  isNull(assetPermissions.deletedAt)
                )
              )
          )
        )
      )
    );

// Child dashboard files from chat messages (when includeAssetChildren is true)
export const childDashboardsFromChats = (organizationId: string, userId: string) =>
  db
    .select({
      assetId: dashboardFiles.id,
      assetType: sql`'dashboard_file'::asset_type_enum`.as('assetType'),
      name: dashboardFiles.name,
      createdAt: dashboardFiles.createdAt,
      updatedAt: dashboardFiles.updatedAt,
      createdBy: dashboardFiles.createdBy,
      organizationId: dashboardFiles.organizationId,
      screenshotBucketKey: dashboardFiles.screenshotBucketKey,
    })
    .from(dashboardFiles)
    .innerJoin(
      messagesToFiles,
      and(
        eq(messagesToFiles.fileId, dashboardFiles.id),
        isNull(messagesToFiles.deletedAt),
        eq(messagesToFiles.isDuplicate, false)
      )
    )
    .innerJoin(messages, eq(messages.id, messagesToFiles.messageId))
    .innerJoin(chats, eq(chats.id, messages.chatId))
    .where(
      and(
        eq(dashboardFiles.organizationId, organizationId),
        isNull(dashboardFiles.deletedAt),
        isNull(messages.deletedAt),
        isNull(chats.deletedAt),
        or(
          ne(chats.workspaceSharing, 'none'),
          exists(
            db
              .select({ value: sql`1` })
              .from(assetPermissions)
              .where(
                and(
                  eq(assetPermissions.assetId, chats.id),
                  eq(assetPermissions.assetType, 'chat'),
                  eq(assetPermissions.identityId, userId),
                  eq(assetPermissions.identityType, 'user'),
                  isNull(assetPermissions.deletedAt)
                )
              )
          )
        )
      )
    );

// Child report files from chat messages (when includeAssetChildren is true)
export const childReportsFromChats = (organizationId: string, userId: string) =>
  db
    .select({
      assetId: reportFiles.id,
      assetType: sql`'report_file'::asset_type_enum`.as('assetType'),
      name: reportFiles.name,
      createdAt: reportFiles.createdAt,
      updatedAt: reportFiles.updatedAt,
      createdBy: reportFiles.createdBy,
      organizationId: reportFiles.organizationId,
      screenshotBucketKey: reportFiles.screenshotBucketKey,
    })
    .from(reportFiles)
    .innerJoin(
      messagesToFiles,
      and(
        eq(messagesToFiles.fileId, reportFiles.id),
        isNull(messagesToFiles.deletedAt),
        eq(messagesToFiles.isDuplicate, false)
      )
    )
    .innerJoin(messages, eq(messages.id, messagesToFiles.messageId))
    .innerJoin(chats, eq(chats.id, messages.chatId))
    .where(
      and(
        eq(reportFiles.organizationId, organizationId),
        isNull(reportFiles.deletedAt),
        isNull(messages.deletedAt),
        isNull(chats.deletedAt),
        or(
          ne(chats.workspaceSharing, 'none'),
          exists(
            db
              .select({ value: sql`1` })
              .from(assetPermissions)
              .where(
                and(
                  eq(assetPermissions.assetId, chats.id),
                  eq(assetPermissions.assetType, 'chat'),
                  eq(assetPermissions.identityId, userId),
                  eq(assetPermissions.identityType, 'user'),
                  isNull(assetPermissions.deletedAt)
                )
              )
          )
        )
      )
    );

// Child metric files from collections (when includeAssetChildren is true)
export const childMetricsFromCollections = (organizationId: string, userId: string) =>
  db
    .select({
      assetId: metricFiles.id,
      assetType: sql`'metric_file'::asset_type_enum`.as('assetType'),
      name: metricFiles.name,
      createdAt: metricFiles.createdAt,
      updatedAt: metricFiles.updatedAt,
      createdBy: metricFiles.createdBy,
      organizationId: metricFiles.organizationId,
      screenshotBucketKey: metricFiles.screenshotBucketKey,
    })
    .from(metricFiles)
    .innerJoin(
      collectionsToAssets,
      and(
        eq(collectionsToAssets.assetId, metricFiles.id),
        eq(collectionsToAssets.assetType, 'metric_file'),
        isNull(collectionsToAssets.deletedAt)
      )
    )
    .innerJoin(collections, eq(collections.id, collectionsToAssets.collectionId))
    .where(
      and(
        eq(metricFiles.organizationId, organizationId),
        isNull(metricFiles.deletedAt),
        isNull(collections.deletedAt),
        or(
          ne(collections.workspaceSharing, 'none'),
          exists(
            db
              .select({ value: sql`1` })
              .from(assetPermissions)
              .where(
                and(
                  eq(assetPermissions.assetId, collections.id),
                  eq(assetPermissions.assetType, 'collection'),
                  eq(assetPermissions.identityId, userId),
                  eq(assetPermissions.identityType, 'user'),
                  isNull(assetPermissions.deletedAt)
                )
              )
          )
        )
      )
    );

// Child dashboard files from collections (when includeAssetChildren is true)
export const childDashboardsFromCollections = (organizationId: string, userId: string) =>
  db
    .select({
      assetId: dashboardFiles.id,
      assetType: sql`'dashboard_file'::asset_type_enum`.as('assetType'),
      name: dashboardFiles.name,
      createdAt: dashboardFiles.createdAt,
      updatedAt: dashboardFiles.updatedAt,
      createdBy: dashboardFiles.createdBy,
      organizationId: dashboardFiles.organizationId,
      screenshotBucketKey: dashboardFiles.screenshotBucketKey,
    })
    .from(dashboardFiles)
    .innerJoin(
      collectionsToAssets,
      and(
        eq(collectionsToAssets.assetId, dashboardFiles.id),
        eq(collectionsToAssets.assetType, 'dashboard_file'),
        isNull(collectionsToAssets.deletedAt)
      )
    )
    .innerJoin(collections, eq(collections.id, collectionsToAssets.collectionId))
    .where(
      and(
        eq(dashboardFiles.organizationId, organizationId),
        isNull(dashboardFiles.deletedAt),
        isNull(collections.deletedAt),
        or(
          ne(collections.workspaceSharing, 'none'),
          exists(
            db
              .select({ value: sql`1` })
              .from(assetPermissions)
              .where(
                and(
                  eq(assetPermissions.assetId, collections.id),
                  eq(assetPermissions.assetType, 'collection'),
                  eq(assetPermissions.identityId, userId),
                  eq(assetPermissions.identityType, 'user'),
                  isNull(assetPermissions.deletedAt)
                )
              )
          )
        )
      )
    );

// Child report files from collections (when includeAssetChildren is true)
export const childReportsFromCollections = (organizationId: string, userId: string) =>
  db
    .select({
      assetId: reportFiles.id,
      assetType: sql`'report_file'::asset_type_enum`.as('assetType'),
      name: reportFiles.name,
      createdAt: reportFiles.createdAt,
      updatedAt: reportFiles.updatedAt,
      createdBy: reportFiles.createdBy,
      organizationId: reportFiles.organizationId,
      screenshotBucketKey: reportFiles.screenshotBucketKey,
    })
    .from(reportFiles)
    .innerJoin(
      collectionsToAssets,
      and(
        eq(collectionsToAssets.assetId, reportFiles.id),
        eq(collectionsToAssets.assetType, 'report_file'),
        isNull(collectionsToAssets.deletedAt)
      )
    )
    .innerJoin(collections, eq(collections.id, collectionsToAssets.collectionId))
    .where(
      and(
        eq(reportFiles.organizationId, organizationId),
        isNull(reportFiles.deletedAt),
        isNull(collections.deletedAt),
        or(
          ne(collections.workspaceSharing, 'none'),
          exists(
            db
              .select({ value: sql`1` })
              .from(assetPermissions)
              .where(
                and(
                  eq(assetPermissions.assetId, collections.id),
                  eq(assetPermissions.assetType, 'collection'),
                  eq(assetPermissions.identityId, userId),
                  eq(assetPermissions.identityType, 'user'),
                  isNull(assetPermissions.deletedAt)
                )
              )
          )
        )
      )
    );

// Child chats from collections (when includeAssetChildren is true)
export const childChatsFromCollections = (organizationId: string, userId: string) =>
  db
    .select({
      assetId: chats.id,
      assetType: sql`'chat'::asset_type_enum`.as('assetType'),
      name: chats.title,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
      createdBy: chats.createdBy,
      organizationId: chats.organizationId,
      screenshotBucketKey: chats.screenshotBucketKey,
    })
    .from(chats)
    .innerJoin(
      collectionsToAssets,
      and(
        eq(collectionsToAssets.assetId, chats.id),
        eq(collectionsToAssets.assetType, 'chat'),
        isNull(collectionsToAssets.deletedAt)
      )
    )
    .innerJoin(collections, eq(collections.id, collectionsToAssets.collectionId))
    .where(
      and(
        eq(chats.organizationId, organizationId),
        isNull(chats.deletedAt),
        isNull(collections.deletedAt),
        or(
          ne(collections.workspaceSharing, 'none'),
          exists(
            db
              .select({ value: sql`1` })
              .from(assetPermissions)
              .where(
                and(
                  eq(assetPermissions.assetId, collections.id),
                  eq(assetPermissions.assetType, 'collection'),
                  eq(assetPermissions.identityId, userId),
                  eq(assetPermissions.identityType, 'user'),
                  isNull(assetPermissions.deletedAt)
                )
              )
          )
        )
      )
    );

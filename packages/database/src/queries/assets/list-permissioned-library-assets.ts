import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  ne,
  not,
  or,
  type SQL,
  sql,
} from 'drizzle-orm';
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
  userLibrary,
  users,
} from '../../schema';
import {
  type AssetType,
  createPaginatedResponse,
  type LibraryAssetListItem,
  type ListPermissionedLibraryAssetsInput,
  ListPermissionedLibraryAssetsInputSchema,
  type ListPermissionedLibraryAssetsResponse,
} from '../../schema-types';

export async function listPermissionedLibraryAssets(
  input: ListPermissionedLibraryAssetsInput
): Promise<ListPermissionedLibraryAssetsResponse> {
  const {
    organizationId,
    userId,
    assetTypes,
    createdById,
    startDate,
    endDate,
    includeCreatedBy,
    excludeCreatedBy,
    ordering,
    orderingDirection,
    groupBy,
    query,
    page,
    page_size,
    includeAssetChildren,
  } = ListPermissionedLibraryAssetsInputSchema.parse(input);

  const offset = (page - 1) * page_size;

  const permissionedReportFiles = db
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
      userLibrary,
      and(
        eq(userLibrary.assetId, reportFiles.id),
        eq(userLibrary.assetType, 'report_file'),
        eq(userLibrary.userId, userId),
        isNull(userLibrary.deletedAt)
      )
    )
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

  const permissionedMetricFiles = db
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
      userLibrary,
      and(
        eq(userLibrary.assetId, metricFiles.id),
        eq(userLibrary.assetType, 'metric_file'),
        eq(userLibrary.userId, userId),
        isNull(userLibrary.deletedAt)
      )
    )
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

  const permissionedDashboardFiles = db
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
      userLibrary,
      and(
        eq(userLibrary.assetId, dashboardFiles.id),
        eq(userLibrary.assetType, 'dashboard_file'),
        eq(userLibrary.userId, userId),
        isNull(userLibrary.deletedAt)
      )
    )
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

  const permissionedChats = db
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
      userLibrary,
      and(
        eq(userLibrary.assetId, chats.id),
        eq(userLibrary.assetType, 'chat'),
        eq(userLibrary.userId, userId),
        isNull(userLibrary.deletedAt)
      )
    )
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

  const permissionedCollections = db
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
    .innerJoin(
      userLibrary,
      and(
        eq(userLibrary.assetId, collections.id),
        eq(userLibrary.assetType, 'collection'),
        eq(userLibrary.userId, userId),
        isNull(userLibrary.deletedAt)
      )
    )
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

  // Child metric files from dashboard files in library (when includeAssetChildren is true)
  const childMetricsFromDashboards = db
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
    .innerJoin(
      userLibrary,
      and(
        eq(userLibrary.assetId, dashboardFiles.id),
        eq(userLibrary.assetType, 'dashboard_file'),
        eq(userLibrary.userId, userId),
        isNull(userLibrary.deletedAt)
      )
    )
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

  // Child metric files from report files in library (when includeAssetChildren is true)
  const childMetricsFromReports = db
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
    .innerJoin(
      userLibrary,
      and(
        eq(userLibrary.assetId, reportFiles.id),
        eq(userLibrary.assetType, 'report_file'),
        eq(userLibrary.userId, userId),
        isNull(userLibrary.deletedAt)
      )
    )
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

  // Child metric files from chat messages in library (when includeAssetChildren is true)
  const childMetricsFromChats = db
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
    .innerJoin(
      userLibrary,
      and(
        eq(userLibrary.assetId, chats.id),
        eq(userLibrary.assetType, 'chat'),
        eq(userLibrary.userId, userId),
        isNull(userLibrary.deletedAt)
      )
    )
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

  // Child dashboard files from chat messages in library (when includeAssetChildren is true)
  const childDashboardsFromChats = db
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
    .innerJoin(
      userLibrary,
      and(
        eq(userLibrary.assetId, chats.id),
        eq(userLibrary.assetType, 'chat'),
        eq(userLibrary.userId, userId),
        isNull(userLibrary.deletedAt)
      )
    )
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

  // Child report files from chat messages in library (when includeAssetChildren is true)
  const childReportsFromChats = db
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
    .innerJoin(
      userLibrary,
      and(
        eq(userLibrary.assetId, chats.id),
        eq(userLibrary.assetType, 'chat'),
        eq(userLibrary.userId, userId),
        isNull(userLibrary.deletedAt)
      )
    )
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

  // Child metric files from collections in library (when includeAssetChildren is true)
  const childMetricsFromCollections = db
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
    .innerJoin(
      userLibrary,
      and(
        eq(userLibrary.assetId, collections.id),
        eq(userLibrary.assetType, 'collection'),
        eq(userLibrary.userId, userId),
        isNull(userLibrary.deletedAt)
      )
    )
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

  // Child dashboard files from collections in library (when includeAssetChildren is true)
  const childDashboardsFromCollections = db
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
    .innerJoin(
      userLibrary,
      and(
        eq(userLibrary.assetId, collections.id),
        eq(userLibrary.assetType, 'collection'),
        eq(userLibrary.userId, userId),
        isNull(userLibrary.deletedAt)
      )
    )
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

  // Child report files from collections in library (when includeAssetChildren is true)
  const childReportsFromCollections = db
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
    .innerJoin(
      userLibrary,
      and(
        eq(userLibrary.assetId, collections.id),
        eq(userLibrary.assetType, 'collection'),
        eq(userLibrary.userId, userId),
        isNull(userLibrary.deletedAt)
      )
    )
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

  // Child chats from collections in library (when includeAssetChildren is true)
  const childChatsFromCollections = db
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
    .innerJoin(
      userLibrary,
      and(
        eq(userLibrary.assetId, collections.id),
        eq(userLibrary.assetType, 'collection'),
        eq(userLibrary.userId, userId),
        isNull(userLibrary.deletedAt)
      )
    )
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

  // Build the union query based on includeAssetChildren parameter
  const baseUnion = permissionedReportFiles
    .union(permissionedMetricFiles)
    .union(permissionedDashboardFiles)
    .union(permissionedChats)
    .union(permissionedCollections);

  const permissionedAssets = includeAssetChildren
    ? baseUnion
        .union(childMetricsFromDashboards)
        .union(childMetricsFromReports)
        .union(childMetricsFromChats)
        .union(childDashboardsFromChats)
        .union(childReportsFromChats)
        .union(childMetricsFromCollections)
        .union(childDashboardsFromCollections)
        .union(childReportsFromCollections)
        .union(childChatsFromCollections)
        .as('permissioned_assets')
    : baseUnion.as('permissioned_assets');

  const filters: SQL[] = [];

  if (assetTypes && assetTypes.length > 0) {
    filters.push(inArray(permissionedAssets.assetType, assetTypes));
  }

  if (createdById) {
    filters.push(eq(permissionedAssets.createdBy, createdById));
  }

  if (startDate) {
    filters.push(gte(permissionedAssets.createdAt, startDate));
  }

  if (endDate) {
    filters.push(lte(permissionedAssets.createdAt, endDate));
  }

  if (includeCreatedBy && includeCreatedBy.length > 0) {
    filters.push(inArray(permissionedAssets.createdBy, includeCreatedBy));
  }

  if (excludeCreatedBy && excludeCreatedBy.length > 0) {
    filters.push(not(inArray(permissionedAssets.createdBy, excludeCreatedBy)));
  }

  if (query) {
    filters.push(ilike(permissionedAssets.name, `%${query}%`));
  }

  const whereCondition =
    filters.length === 0 ? undefined : filters.length === 1 ? filters[0] : and(...filters);

  const baseAssetQuery = db
    .select({
      assetId: permissionedAssets.assetId,
      assetType: permissionedAssets.assetType,
      name: permissionedAssets.name,
      updatedAt: permissionedAssets.updatedAt,
      updatedAtDate: sql<string>`DATE(${permissionedAssets.updatedAt})`.as('updated_at_date'),
      createdAt: permissionedAssets.createdAt,
      createdAtDate: sql<string>`DATE(${permissionedAssets.createdAt})`.as('created_at_date'),
      createdBy: permissionedAssets.createdBy,
      createdByName: users.name,
      createdByEmail: users.email,
      createdByAvatarUrl: users.avatarUrl,
      screenshotBucketKey: permissionedAssets.screenshotBucketKey,
      organizationId: permissionedAssets.organizationId,
    })
    .from(permissionedAssets)
    .innerJoin(users, eq(permissionedAssets.createdBy, users.id));

  const filteredAssetQuery = whereCondition ? baseAssetQuery.where(whereCondition) : baseAssetQuery;

  // Determine ordering direction (default to desc for backward compatibility)
  const direction = orderingDirection === 'asc' ? asc : desc;

  // Apply ordering and execute query
  const assetsResult = await (async () => {
    if (ordering === 'updated_at') {
      return await filteredAssetQuery
        .orderBy(direction(permissionedAssets.updatedAt))
        .limit(page_size)
        .offset(offset);
    }
    if (ordering === 'created_at') {
      return await filteredAssetQuery
        .orderBy(direction(permissionedAssets.createdAt))
        .limit(page_size)
        .offset(offset);
    }
    // No explicit ordering - let database decide
    return await filteredAssetQuery.limit(page_size).offset(offset);
  })();

  const baseCountQuery = db.select({ total: count() }).from(permissionedAssets);
  const countResult = await (whereCondition
    ? baseCountQuery.where(whereCondition)
    : baseCountQuery);
  const totalValue = countResult[0]?.total ?? 0;

  const libraryAssets: LibraryAssetListItem[] = assetsResult.map((asset) => ({
    asset_id: asset.assetId,
    asset_type: asset.assetType as AssetType,
    name: asset.name ?? '',
    created_at: asset.createdAt,
    updated_at: asset.updatedAt,
    created_by: asset.createdBy,
    created_by_name: asset.createdByName,
    created_by_email: asset.createdByEmail,
    created_by_avatar_url: asset.createdByAvatarUrl,
    screenshot_url: asset.screenshotBucketKey,
  }));

  // Handle groupBy
  if (groupBy && groupBy !== 'none') {
    const groups: Record<string, LibraryAssetListItem[]> = {};

    for (let i = 0; i < libraryAssets.length; i++) {
      const asset = libraryAssets[i];
      const resultAsset = assetsResult[i];
      if (!asset || !resultAsset) {
        continue;
      }

      let groupKey: string;

      if (groupBy === 'asset_type') {
        groupKey = asset.asset_type;
      } else if (groupBy === 'owner') {
        groupKey = asset.created_by;
      } else if (groupBy === 'created_at') {
        // Use database-computed date (YYYY-MM-DD) for consistent day-based grouping
        groupKey = resultAsset.createdAtDate;
      } else if (groupBy === 'updated_at') {
        // Use database-computed date (YYYY-MM-DD) for consistent day-based grouping
        groupKey = resultAsset.updatedAtDate;
      } else {
        groupKey = 'ungrouped';
      }

      const groupArray = groups[groupKey] ?? [];
      groupArray.push(asset);
      groups[groupKey] = groupArray;
    }

    const totalPages = Math.ceil(totalValue / page_size);
    const hasMore = page < totalPages;

    return {
      groups,
      pagination: {
        page,
        page_size,
        has_more: hasMore,
      },
    };
  }

  return createPaginatedResponse({
    data: libraryAssets,
    page,
    page_size,
    total: totalValue,
  });
}

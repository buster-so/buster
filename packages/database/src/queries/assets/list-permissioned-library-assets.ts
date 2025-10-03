import {
  type SQL,
  and,
  count,
  desc,
  eq,
  exists,
  gte,
  inArray,
  isNull,
  lte,
  ne,
  not,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '../../connection';
import {
  assetPermissions,
  chats,
  dashboardFiles,
  metricFiles,
  reportFiles,
  users,
} from '../../schema';
import {
  type LibraryAssetListItem,
  type LibraryAssetType,
  type ListPermissionedLibraryAssetsInput,
  ListPermissionedLibraryAssetsInputSchema,
  type ListPermissionedLibraryAssetsResponse,
  createPaginatedResponse,
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
    page,
    page_size,
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
    })
    .from(reportFiles)
    .where(
      and(
        eq(reportFiles.organizationId, organizationId),
        eq(reportFiles.savedToLibrary, true),
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
    })
    .from(metricFiles)
    .where(
      and(
        eq(metricFiles.organizationId, organizationId),
        eq(metricFiles.savedToLibrary, true),
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
    })
    .from(dashboardFiles)
    .where(
      and(
        eq(dashboardFiles.organizationId, organizationId),
        eq(dashboardFiles.savedToLibrary, true),
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
    })
    .from(chats)
    .where(
      and(
        eq(chats.organizationId, organizationId),
        eq(chats.savedToLibrary, true),
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

  const permissionedAssets = permissionedReportFiles
    .union(permissionedMetricFiles)
    .union(permissionedDashboardFiles)
    .union(permissionedChats)
    .as('permissioned_assets');

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

  const whereCondition =
    filters.length === 0 ? undefined : filters.length === 1 ? filters[0] : and(...filters);

  const baseAssetQuery = db
    .select({
      assetId: permissionedAssets.assetId,
      assetType: permissionedAssets.assetType,
      name: permissionedAssets.name,
      updatedAt: permissionedAssets.updatedAt,
      createdAt: permissionedAssets.createdAt,
      createdBy: permissionedAssets.createdBy,
      createdByName: users.name,
      createdByEmail: users.email,
      createdByAvatarUrl: users.avatarUrl,
    })
    .from(permissionedAssets)
    .innerJoin(users, eq(permissionedAssets.createdBy, users.id));

  const filteredAssetQuery = whereCondition ? baseAssetQuery.where(whereCondition) : baseAssetQuery;

  const assetsResult = await filteredAssetQuery
    .orderBy(desc(permissionedAssets.createdAt))
    .limit(page_size)
    .offset(offset);

  const baseCountQuery = db.select({ total: count() }).from(permissionedAssets);
  const countResult = await (whereCondition
    ? baseCountQuery.where(whereCondition)
    : baseCountQuery);
  const totalValue = countResult[0]?.total ?? 0;

  const libraryAssets: LibraryAssetListItem[] = assetsResult.map((asset) => ({
    asset_id: asset.assetId,
    asset_type: asset.assetType as LibraryAssetType,
    name: asset.name ?? '',
    created_at: asset.createdAt,
    updated_at: asset.updatedAt,
    created_by: asset.createdBy,
    created_by_name: asset.createdByName,
    created_by_email: asset.createdByEmail,
    created_by_avatar_url: asset.createdByAvatarUrl,
  }));

  return createPaginatedResponse({
    data: libraryAssets,
    page,
    page_size,
    total: totalValue,
  });
}

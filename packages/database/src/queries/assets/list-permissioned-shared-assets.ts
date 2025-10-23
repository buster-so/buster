import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  ne,
  not,
  type SQL,
  sql,
} from 'drizzle-orm';
import { db } from '../../connection';
import { users } from '../../schema';
import {
  type AssetListItem,
  type AssetType,
  createPaginatedResponse,
  type ListPermissionedAssetsInput,
  ListPermissionedAssetsInputSchema,
  type ListPermissionedAssetsResponse,
} from '../../schema-types';
import {
  childChatsFromCollections,
  childDashboardsFromChats,
  childDashboardsFromCollections,
  childMetricsFromChats,
  childMetricsFromCollections,
  childMetricsFromDashboards,
  childMetricsFromReports,
  childReportsFromChats,
  childReportsFromCollections,
  permissionedChats,
  permissionedCollections,
  permissionedDashboardFiles,
  permissionedMetricFiles,
  permissionedReportFiles,
} from '../asset-permissions/asset-permission-subqueries';

export async function listPermissionedSharedAssets(
  input: ListPermissionedAssetsInput
): Promise<ListPermissionedAssetsResponse> {
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
  } = ListPermissionedAssetsInputSchema.parse(input);

  const offset = (page - 1) * page_size;

  // Build the union query based on includeAssetChildren parameter
  const baseUnion = permissionedReportFiles(organizationId, userId)
    .union(permissionedMetricFiles(organizationId, userId))
    .union(permissionedDashboardFiles(organizationId, userId))
    .union(permissionedChats(organizationId, userId))
    .union(permissionedCollections(organizationId, userId));

  const allPermissionedAssets = includeAssetChildren
    ? baseUnion
        .union(childMetricsFromDashboards(organizationId, userId))
        .union(childMetricsFromReports(organizationId, userId))
        .union(childMetricsFromChats(organizationId, userId))
        .union(childDashboardsFromChats(organizationId, userId))
        .union(childReportsFromChats(organizationId, userId))
        .union(childMetricsFromCollections(organizationId, userId))
        .union(childDashboardsFromCollections(organizationId, userId))
        .union(childReportsFromCollections(organizationId, userId))
        .union(childChatsFromCollections(organizationId, userId))
    : baseUnion;

  // Filter for shared assets (not created by the current user)
  const permissionedAssets = allPermissionedAssets.as('permissioned_assets');

  const filters: SQL[] = [ne(permissionedAssets.createdBy, userId)];

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

  const sharedAssets: AssetListItem[] = assetsResult.map((asset) => ({
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
    const groups: Record<string, AssetListItem[]> = {};

    for (let i = 0; i < sharedAssets.length; i++) {
      const asset = sharedAssets[i];
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
    data: sharedAssets,
    page,
    page_size,
    total: totalValue,
  });
}

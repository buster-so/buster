import { and, asc, eq, gte, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '../../connection';
import {
  chats,
  collections,
  dashboardFiles,
  metricFiles,
  reportFiles,
  userFavorites,
} from '../../schema';
import type { AssetType } from '../../schema-types';

/**
 * Favorite object with id, name, and type
 */
export interface UserFavorite {
  id: string;
  name: string;
  asset_type: AssetType;
}

/**
 * Request for creating favorites
 */
export interface CreateFavoriteRequest {
  id: string;
  asset_type: AssetType;
  index?: number | undefined;
}

/**
 * List all user favorites ordered by their index
 */
export async function listUserFavorites(userId: string): Promise<UserFavorite[]> {
  // Get user favorites ordered by index
  const favoritesRecords = await db
    .select({
      assetId: userFavorites.assetId,
      assetType: userFavorites.assetType,
    })
    .from(userFavorites)
    .where(and(eq(userFavorites.userId, userId), isNull(userFavorites.deletedAt)))
    .orderBy(asc(userFavorites.orderIndex));

  if (favoritesRecords.length === 0) {
    return [];
  }

  // Group favorites by type
  const dashboardIds = favoritesRecords
    .filter((f) => f.assetType === 'dashboard_file')
    .map((f) => f.assetId);
  const collectionIds = favoritesRecords
    .filter((f) => f.assetType === 'collection')
    .map((f) => f.assetId);
  const metricIds = favoritesRecords
    .filter((f) => f.assetType === 'metric_file')
    .map((f) => f.assetId);
  const chatIds = favoritesRecords.filter((f) => f.assetType === 'chat').map((f) => f.assetId);
  const reportIds = favoritesRecords
    .filter((f) => f.assetType === 'report_file')
    .map((f) => f.assetId);

  // Fetch names in parallel
  const [dashboards, collectionsData, metrics, chatRecords, reports] = await Promise.all([
    dashboardIds.length > 0
      ? db
          .select({ id: dashboardFiles.id, name: dashboardFiles.name })
          .from(dashboardFiles)
          .where(and(inArray(dashboardFiles.id, dashboardIds), isNull(dashboardFiles.deletedAt)))
      : Promise.resolve([]),
    collectionIds.length > 0
      ? db
          .select({ id: collections.id, name: collections.name })
          .from(collections)
          .where(and(inArray(collections.id, collectionIds), isNull(collections.deletedAt)))
      : Promise.resolve([]),
    metricIds.length > 0
      ? db
          .select({ id: metricFiles.id, name: metricFiles.name })
          .from(metricFiles)
          .where(and(inArray(metricFiles.id, metricIds), isNull(metricFiles.deletedAt)))
      : Promise.resolve([]),
    chatIds.length > 0
      ? db
          .select({ id: chats.id, name: chats.title })
          .from(chats)
          .where(and(inArray(chats.id, chatIds), isNull(chats.deletedAt)))
      : Promise.resolve([]),
    reportIds.length > 0
      ? db
          .select({ id: reportFiles.id, name: reportFiles.name })
          .from(reportFiles)
          .where(and(inArray(reportFiles.id, reportIds), isNull(reportFiles.deletedAt)))
      : Promise.resolve([]),
  ]);

  // Create maps for quick lookup
  const dashboardMap = new Map(dashboards.map((d) => [d.id, d.name]));
  const collectionMap = new Map(collectionsData.map((c) => [c.id, c.name]));
  const metricMap = new Map(metrics.map((m) => [m.id, m.name]));
  const chatMap = new Map(chatRecords.map((c) => [c.id, c.name]));
  const reportMap = new Map(reports.map((r) => [r.id, r.name]));

  // Build favorites array in the original order
  const favorites: UserFavorite[] = [];
  for (const fav of favoritesRecords) {
    let name: string | undefined;

    if (fav.assetType === 'dashboard_file') {
      name = dashboardMap.get(fav.assetId);
    } else if (fav.assetType === 'collection') {
      name = collectionMap.get(fav.assetId);
    } else if (fav.assetType === 'metric_file') {
      name = metricMap.get(fav.assetId);
    } else if (fav.assetType === 'chat') {
      name = chatMap.get(fav.assetId);
    } else if (fav.assetType === 'report_file') {
      name = reportMap.get(fav.assetId);
    } else {
      const _exhaustiveCheck: never = fav.assetType;
      console.error('Unknown asset type:', _exhaustiveCheck);
    }

    if (name) {
      favorites.push({
        id: fav.assetId,
        name,
        asset_type: fav.assetType,
      });
    }
  }

  return favorites;
}

/**
 * Create/add new favorites for a user
 * Handles bulk creation and index shifting
 */
export async function createUserFavorites(
  userId: string,
  newFavorites: CreateFavoriteRequest[]
): Promise<void> {
  if (newFavorites.length === 0) {
    return;
  }

  // Find the minimum index to know where to start shifting
  const minIndex = Math.min(...newFavorites.map((f) => f.index ?? 0));

  // Shift existing favorites to make room for new ones
  await db
    .update(userFavorites)
    .set({
      orderIndex: sql`${userFavorites.orderIndex} + ${newFavorites.length}`,
    })
    .where(and(eq(userFavorites.userId, userId), gte(userFavorites.orderIndex, minIndex)));

  // Prepare new favorites for insertion
  const favoritesToInsert = newFavorites.map((fav, i) => ({
    userId,
    assetId: fav.id,
    assetType: fav.asset_type,
    orderIndex: (fav.index ?? 0) + i,
    deletedAt: null,
  }));

  // Insert new favorites with upsert logic
  await db
    .insert(userFavorites)
    .values(favoritesToInsert)
    .onConflictDoUpdate({
      target: [userFavorites.userId, userFavorites.assetId, userFavorites.assetType],
      set: {
        deletedAt: sql`EXCLUDED.deleted_at`,
        orderIndex: sql`EXCLUDED.order_index`,
      },
    });
}

/**
 * Delete favorites (soft delete)
 * Handles bulk deletion
 */
export async function deleteUserFavorites(userId: string, assetIds: string[]): Promise<void> {
  if (assetIds.length === 0) {
    return;
  }

  // Soft delete favorites
  await db
    .update(userFavorites)
    .set({
      deletedAt: new Date().toISOString(),
    })
    .where(and(eq(userFavorites.userId, userId), inArray(userFavorites.assetId, assetIds)));
}

/**
 * Update/reorder user favorites
 * The order of asset IDs in the array determines the new order
 */
export async function updateUserFavorites(
  userId: string,
  orderedAssetIds: string[]
): Promise<void> {
  if (orderedAssetIds.length === 0) {
    return;
  }

  // Get current favorites to find their asset types
  const currentFavorites = await db
    .select({
      assetId: userFavorites.assetId,
      assetType: userFavorites.assetType,
    })
    .from(userFavorites)
    .where(and(eq(userFavorites.userId, userId), isNull(userFavorites.deletedAt)));

  // Create a map of asset_id to asset_type
  const favoriteMap = new Map(currentFavorites.map((f) => [f.assetId, f.assetType]));

  // Build new favorites array with updated order
  const favoritesToUpdate = orderedAssetIds
    .map((assetId, index) => {
      const assetType = favoriteMap.get(assetId);
      if (!assetType) return null;

      return {
        userId,
        assetId,
        assetType,
        orderIndex: index,
        deletedAt: null,
      };
    })
    .filter((f) => f !== null);

  if (favoritesToUpdate.length > 0) {
    // Upsert with updated order indices
    await db
      .insert(userFavorites)
      .values(favoritesToUpdate)
      .onConflictDoUpdate({
        target: [userFavorites.userId, userFavorites.assetId, userFavorites.assetType],
        set: {
          orderIndex: sql`EXCLUDED.order_index`,
        },
      });
  }
}

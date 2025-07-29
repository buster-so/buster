import type { User } from '@buster/database';
import {
  checkChatsContainingAsset,
  checkCollectionsContainingAsset,
  checkDashboardsContainingMetric,
} from '@buster/database';
import type { AssetPermissionRole, AssetType } from '../types/asset-permissions';
import { AccessControlError } from '../types/errors';
import { getCachedCascadingPermission, setCachedCascadingPermission } from './cache';
import { hasAssetPermission } from './permissions';

/**
 * Check if a user has access to a metric through any dashboard that contains it.
 * If a user has access to a dashboard (direct, public, or workspace), they can view the metrics in it.
 */
export async function checkMetricDashboardAccess(metricId: string, user: User): Promise<boolean> {
  try {
    // Get all dashboards containing this metric
    const dashboards = await checkDashboardsContainingMetric(metricId);

    if (!dashboards || dashboards.length === 0) {
      return false;
    }

    // Check if user has access to any of these dashboards
    for (const dashboard of dashboards) {
      const hasAccess = await hasAssetPermission({
        assetId: dashboard.id,
        assetType: 'dashboard' as AssetType,
        userId: user.id,
        requiredRole: 'can_view' as AssetPermissionRole,
      });

      if (hasAccess) {
        return true;
      }
    }

    return false;
  } catch (error) {
    throw new AccessControlError(
      'cascading_permission_error',
      'Failed to check metric dashboard access',
      { error }
    );
  }
}

/**
 * Check if a user has access to a metric through any chat that contains it.
 * If a user has access to a chat (direct, public, or workspace), they can view the metrics in it.
 */
export async function checkMetricChatAccess(metricId: string, user: User): Promise<boolean> {
  try {
    // Get all chats containing this metric
    const chats = await checkChatsContainingAsset(metricId, 'metric');

    if (!chats || chats.length === 0) {
      return false;
    }

    // Check if user has access to any of these chats
    for (const chat of chats) {
      const hasAccess = await hasAssetPermission({
        assetId: chat.id,
        assetType: 'chat' as AssetType,
        userId: user.id,
        requiredRole: 'can_view' as AssetPermissionRole,
      });

      if (hasAccess) {
        return true;
      }
    }

    return false;
  } catch (error) {
    throw new AccessControlError(
      'cascading_permission_error',
      'Failed to check metric chat access',
      { error }
    );
  }
}

/**
 * Check if a user has access to a dashboard through any chat that contains it.
 * If a user has access to a chat (direct, public, or workspace), they can view the dashboards in it.
 */
export async function checkDashboardChatAccess(dashboardId: string, user: User): Promise<boolean> {
  try {
    // Get all chats containing this dashboard
    const chats = await checkChatsContainingAsset(dashboardId, 'dashboard');

    if (!chats || chats.length === 0) {
      return false;
    }

    // Check if user has access to any of these chats
    for (const chat of chats) {
      const hasAccess = await hasAssetPermission({
        assetId: chat.id,
        assetType: 'chat' as AssetType,
        userId: user.id,
        requiredRole: 'can_view' as AssetPermissionRole,
      });

      if (hasAccess) {
        return true;
      }
    }

    return false;
  } catch (error) {
    throw new AccessControlError(
      'cascading_permission_error',
      'Failed to check dashboard chat access',
      { error }
    );
  }
}

/**
 * Check if a user has access to a metric through any collection that contains it.
 * If a user has access to a collection (direct or workspace), they can view the metrics in it.
 */
export async function checkMetricCollectionAccess(metricId: string, user: User): Promise<boolean> {
  try {
    // Get all collections containing this metric
    const collections = await checkCollectionsContainingAsset(metricId, 'metric');

    if (!collections || collections.length === 0) {
      return false;
    }

    // Check if user has access to any of these collections
    for (const collection of collections) {
      const hasAccess = await hasAssetPermission({
        assetId: collection.id,
        assetType: 'collection' as AssetType,
        userId: user.id,
        requiredRole: 'can_view' as AssetPermissionRole,
      });

      if (hasAccess) {
        return true;
      }
    }

    return false;
  } catch (error) {
    throw new AccessControlError(
      'cascading_permission_error',
      'Failed to check metric collection access',
      { error }
    );
  }
}

/**
 * Check if a user has access to a dashboard through any collection that contains it.
 * If a user has access to a collection (direct or workspace), they can view the dashboards in it.
 */
export async function checkDashboardCollectionAccess(
  dashboardId: string,
  user: User
): Promise<boolean> {
  try {
    // Get all collections containing this dashboard
    const collections = await checkCollectionsContainingAsset(dashboardId, 'dashboard');

    if (!collections || collections.length === 0) {
      return false;
    }

    // Check if user has access to any of these collections
    for (const collection of collections) {
      const hasAccess = await hasAssetPermission({
        assetId: collection.id,
        assetType: 'collection' as AssetType,
        userId: user.id,
        requiredRole: 'can_view' as AssetPermissionRole,
      });

      if (hasAccess) {
        return true;
      }
    }

    return false;
  } catch (error) {
    throw new AccessControlError(
      'cascading_permission_error',
      'Failed to check dashboard collection access',
      { error }
    );
  }
}

/**
 * Check if a user has access to a chat through any collection that contains it.
 * If a user has access to a collection (direct or workspace), they can view the chats in it.
 */
export async function checkChatCollectionAccess(chatId: string, user: User): Promise<boolean> {
  try {
    // Get all collections containing this chat
    const collections = await checkCollectionsContainingAsset(chatId, 'chat');

    if (!collections || collections.length === 0) {
      return false;
    }

    // Check if user has access to any of these collections
    for (const collection of collections) {
      const hasAccess = await hasAssetPermission({
        assetId: collection.id,
        assetType: 'collection' as AssetType,
        userId: user.id,
        requiredRole: 'can_view' as AssetPermissionRole,
      });

      if (hasAccess) {
        return true;
      }
    }

    return false;
  } catch (error) {
    throw new AccessControlError(
      'cascading_permission_error',
      'Failed to check chat collection access',
      { error }
    );
  }
}

/**
 * Check cascading permissions for an asset.
 * This checks if a user has access to an asset through other assets that contain it.
 */
export async function checkCascadingPermissions(
  assetId: string,
  assetType: AssetType,
  user: User
): Promise<boolean> {
  // Check cache first
  const cached = getCachedCascadingPermission(user.id, assetId, assetType);
  if (cached !== undefined) {
    return cached;
  }

  try {
    let hasAccess = false;

    switch (assetType) {
      case 'metric': {
        // Check access through dashboards, chats, and collections
        const dashboardAccess = await checkMetricDashboardAccess(assetId, user);
        if (dashboardAccess) {
          hasAccess = true;
          break;
        }

        const chatAccess = await checkMetricChatAccess(assetId, user);
        if (chatAccess) {
          hasAccess = true;
          break;
        }

        const collectionAccess = await checkMetricCollectionAccess(assetId, user);
        if (collectionAccess) {
          hasAccess = true;
          break;
        }
        break;
      }

      case 'dashboard': {
        // Check access through chats and collections
        const dashboardChatAccess = await checkDashboardChatAccess(assetId, user);
        if (dashboardChatAccess) {
          hasAccess = true;
          break;
        }

        const dashboardCollectionAccess = await checkDashboardCollectionAccess(assetId, user);
        if (dashboardCollectionAccess) {
          hasAccess = true;
          break;
        }
        break;
      }

      case 'chat': {
        // Check access through collections
        const chatCollectionAccess = await checkChatCollectionAccess(assetId, user);
        if (chatCollectionAccess) {
          hasAccess = true;
          break;
        }
        break;
      }

      case 'collection':
        // Collections don't have cascading permissions
        hasAccess = false;
        break;

      default:
        hasAccess = false;
    }

    // Cache the result
    setCachedCascadingPermission(user.id, assetId, assetType, hasAccess);
    return hasAccess;
  } catch (error) {
    throw new AccessControlError(
      'cascading_permission_error',
      'Failed to check cascading permissions',
      { error }
    );
  }
}

import {
  checkChatsContainingAsset,
  checkCollectionsContainingAsset,
  checkDashboardsContainingMetric,
  checkReportsContainingMetric,
} from '@buster/database/queries';
import type { User } from '@buster/database/queries';
import type { AssetType } from '@buster/database/schema-types';
import type { AssetPermissionRole, WorkspaceSharing } from '../types/asset-permissions';
import { AccessControlError } from '../types/errors';
import { getCachedCascadingPermission, setCachedCascadingPermission } from './cache';
import { hasAssetPermission } from './permissions';

/**
 * Check if a user has access to a metric through any dashboard that contains it.
 * If a user has access to a dashboard (direct, public, or workspace), they can view the metrics in it.
 */
export async function checkMetricDashboardAccess(
  metricId: string,
  user: User,
  userSuppliedPassword?: string
): Promise<boolean> {
  try {
    // Get all dashboards containing this metric with their workspace sharing info
    const dashboards = await checkDashboardsContainingMetric(metricId);

    if (!dashboards || dashboards.length === 0) {
      return false;
    }

    // Check if user has access to any of these dashboards
    for (const dashboard of dashboards) {
      const hasAccess = await hasAssetPermission({
        assetId: dashboard.id,
        assetType: 'dashboard_file' as AssetType,
        userId: user.id,
        requiredRole: 'can_view' as AssetPermissionRole,
        organizationId: dashboard.organizationId,
        workspaceSharing: (dashboard.workspaceSharing as WorkspaceSharing) ?? 'none',
        publiclyAccessible: dashboard.publiclyAccessible,
        publicExpiryDate: dashboard.publicExpiryDate ?? undefined,
        publicPassword: dashboard.publicPassword ?? undefined,
        userSuppliedPassword: userSuppliedPassword,
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
export async function checkMetricChatAccess(
  metricId: string,
  user: User,
  userSuppliedPassword?: string
): Promise<boolean> {
  try {
    // Get all chats containing this metric with their workspace sharing info
    const chats = await checkChatsContainingAsset(metricId, 'metric_file');

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
        organizationId: chat.organizationId,
        workspaceSharing: (chat.workspaceSharing as WorkspaceSharing) ?? 'none',
        publiclyAccessible: chat.publiclyAccessible,
        publicExpiryDate: chat.publicExpiryDate ?? undefined,
        publicPassword: chat.publicPassword ?? undefined,
        userSuppliedPassword: userSuppliedPassword,
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
 * Check if a user has access to a metric through any report that contains it.
 * If a user has access to a report (direct, public, or workspace), they can view the metrics in it.
 */
export async function checkMetricReportAccess(
  metricId: string,
  user: User,
  userSuppliedPassword?: string
): Promise<boolean> {
  try {
    // Get all reports containing this metric with their workspace sharing info
    const reports = await checkReportsContainingMetric(metricId);

    if (!reports || reports.length === 0) {
      return false;
    }

    // Check if user has access to any of these reports
    for (const report of reports) {
      const hasAccess = await hasAssetPermission({
        assetId: report.id,
        assetType: 'report_file' as AssetType,
        userId: user.id,
        requiredRole: 'can_view' as AssetPermissionRole,
        organizationId: report.organizationId,
        workspaceSharing: (report.workspaceSharing as WorkspaceSharing) ?? 'none',
        publiclyAccessible: report.publiclyAccessible,
        publicExpiryDate: report.publicExpiryDate ?? undefined,
        publicPassword: report.publicPassword ?? undefined,
        userSuppliedPassword: userSuppliedPassword,
      });

      if (hasAccess) {
        return true;
      }
    }

    return false;
  } catch (error) {
    throw new AccessControlError(
      'cascading_permission_error',
      'Failed to check metric report access',
      { error }
    );
  }
}

/**
 * Check if a user has access to a dashboard through any chat that contains it.
 * If a user has access to a chat (direct, public, or workspace), they can view the dashboards in it.
 */
export async function checkDashboardChatAccess(
  dashboardId: string,
  user: User,
  userSuppliedPassword?: string
): Promise<boolean> {
  try {
    // Get all chats containing this dashboard with their workspace sharing info
    const chats = await checkChatsContainingAsset(dashboardId, 'dashboard_file');

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
        organizationId: chat.organizationId,
        workspaceSharing: (chat.workspaceSharing as WorkspaceSharing) ?? 'none',
        publiclyAccessible: chat.publiclyAccessible,
        publicExpiryDate: chat.publicExpiryDate ?? undefined,
        publicPassword: chat.publicPassword ?? undefined,
        userSuppliedPassword: userSuppliedPassword,
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
    // Get all collections containing this metric with their workspace sharing info
    const collections = await checkCollectionsContainingAsset(metricId, 'metric_file');

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
        organizationId: collection.organizationId,
        workspaceSharing: (collection.workspaceSharing as WorkspaceSharing) ?? 'none',
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
    // Get all collections containing this dashboard with their workspace sharing info
    const collections = await checkCollectionsContainingAsset(dashboardId, 'dashboard_file');

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
        organizationId: collection.organizationId,
        workspaceSharing: (collection.workspaceSharing as WorkspaceSharing) ?? 'none',
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
    // Get all collections containing this chat with their workspace sharing info
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
        organizationId: collection.organizationId,
        workspaceSharing: (collection.workspaceSharing as WorkspaceSharing) ?? 'none',
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
 * Check if a user has access to a report through any chat that contains it.
 * If a user has access to a chat (direct, public, or workspace), they can view the reports in it.
 */
export async function checkReportChatAccess(
  reportId: string,
  user: User,
  userSuppliedPassword?: string
): Promise<boolean> {
  try {
    // Get all chats containing this dashboard with their workspace sharing info
    const chats = await checkChatsContainingAsset(reportId, 'report_file');

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
        organizationId: chat.organizationId,
        workspaceSharing: (chat.workspaceSharing as WorkspaceSharing) ?? 'none',
        publiclyAccessible: chat.publiclyAccessible,
        publicExpiryDate: chat.publicExpiryDate ?? undefined,
        publicPassword: chat.publicPassword ?? undefined,
        userSuppliedPassword: userSuppliedPassword,
      });

      if (hasAccess) {
        return true;
      }
    }

    return false;
  } catch (error) {
    throw new AccessControlError(
      'cascading_permission_error',
      'Failed to check report chat access',
      { error }
    );
  }
}

/**
 * Check if a user has access to a report through any collection that contains it.
 * If a user has access to a collection (direct or workspace), they can view the reports in it.
 */
export async function checkReportCollectionAccess(reportId: string, user: User): Promise<boolean> {
  try {
    // Get all collections containing this report with their workspace sharing info
    const collections = await checkCollectionsContainingAsset(reportId, 'report_file');

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
        organizationId: collection.organizationId,
        workspaceSharing: (collection.workspaceSharing as WorkspaceSharing) ?? 'none',
      });

      if (hasAccess) {
        return true;
      }
    }

    return false;
  } catch (error) {
    throw new AccessControlError(
      'cascading_permission_error',
      'Failed to check report collection access',
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
  user: User,
  userSuppliedPassword?: string
): Promise<boolean> {
  // Check cache first
  const cached = getCachedCascadingPermission(user.id, assetId, assetType);
  if (cached !== undefined) {
    return cached;
  }

  try {
    let hasAccess = false;

    switch (assetType) {
      case 'metric_file': {
        // Check access through dashboards, chats, collections, and reports
        const dashboardAccess = await checkMetricDashboardAccess(
          assetId,
          user,
          userSuppliedPassword
        );
        if (dashboardAccess) {
          hasAccess = true;
          break;
        }

        const chatAccess = await checkMetricChatAccess(assetId, user, userSuppliedPassword);
        if (chatAccess) {
          hasAccess = true;
          break;
        }

        const collectionAccess = await checkMetricCollectionAccess(assetId, user);
        if (collectionAccess) {
          hasAccess = true;
          break;
        }

        const reportAccess = await checkMetricReportAccess(assetId, user, userSuppliedPassword);
        if (reportAccess) {
          hasAccess = true;
          break;
        }
        break;
      }

      case 'dashboard_file': {
        // Check access through chats and collections
        const dashboardChatAccess = await checkDashboardChatAccess(
          assetId,
          user,
          userSuppliedPassword
        );
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

      case 'report_file': {
        // Check access through chats and collections
        const reportChatAccess = await checkReportChatAccess(assetId, user, userSuppliedPassword);
        if (reportChatAccess) {
          hasAccess = true;
          break;
        }

        const reportCollectionAccess = await checkReportCollectionAccess(assetId, user);
        if (reportCollectionAccess) {
          hasAccess = true;
          break;
        }
        break;
      }

      case 'collection':
        hasAccess = false;
        break;
      // Collections don't have cascading permissions (they're top-level)
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

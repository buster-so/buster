import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import {
  assetPermissions,
  collections,
  collectionsToAssets,
  reportFiles,
  users,
} from '../../schema';
import { getAssetPermission } from '../assets';
import { getOrganizationMemberCount, getUserOrganizationId } from '../organizations';

export const GetReportInputSchema = z.object({
  reportId: z.string().uuid('Report ID must be a valid UUID'),
  userId: z.string().uuid('User ID must be a valid UUID'),
});

type GetReportInput = z.infer<typeof GetReportInputSchema>;

export async function getReport(input: GetReportInput) {
  const validated = GetReportInputSchema.parse(input);

  const { reportId, userId } = validated;

  const userOrg = await getUserOrganizationId(userId);

  if (!userOrg?.organizationId) {
    throw new Error('User not found in any organization');
  }

  const { organizationId } = userOrg;

  const reportCollectionsQuery = db
    .select({
      id: collections.id,
      name: collections.name,
      description: collections.description,
    })
    .from(collectionsToAssets)
    .innerJoin(collections, eq(collectionsToAssets.collectionId, collections.id))
    .where(
      and(
        eq(collectionsToAssets.assetId, reportId),
        eq(collectionsToAssets.assetType, 'report_file'),
        isNull(collectionsToAssets.deletedAt),
        isNull(collections.deletedAt),
        eq(collections.organizationId, organizationId)
      )
    );

  const reportDataQuery = await db
    .select({
      // All reportFiles columns
      id: reportFiles.id,
      name: reportFiles.name,
      content: reportFiles.content,
      created_at: reportFiles.createdAt,
      updated_at: reportFiles.updatedAt,
      publicly_accessible: reportFiles.publiclyAccessible,
      public_expiry_date: reportFiles.publicExpiryDate,
      version_history: reportFiles.versionHistory,
      public_password: reportFiles.publicPassword,
      public_enabled_by: reportFiles.publiclyEnabledBy,
      workspace_sharing: reportFiles.workspaceSharing,
      // User metadata
      created_by_id: users.id,
      created_by_name: users.name,
      created_by_avatar: users.avatarUrl,
    })
    .from(reportFiles)
    .innerJoin(users, eq(reportFiles.createdBy, users.id))
    .where(
      and(
        eq(reportFiles.id, reportId),
        eq(reportFiles.organizationId, organizationId),
        isNull(reportFiles.deletedAt)
      )
    )
    .limit(1);

  // Individual permissions query - get users with direct permissions to this report
  const individualPermissionsQuery = db
    .select({
      id: users.id,
      role: assetPermissions.role,
      email: users.email,
      name: users.name,
      avatar_url: users.avatarUrl,
    })
    .from(assetPermissions)
    .innerJoin(users, eq(users.id, assetPermissions.identityId))
    .where(
      and(
        eq(assetPermissions.assetId, reportId),
        eq(assetPermissions.assetType, 'report_file'),
        eq(assetPermissions.identityType, 'user'),
        isNull(assetPermissions.deletedAt)
      )
    );

  // Get workspace member count and user's permission for this report
  const [
    reportDataResult,
    reportCollectionsResult,
    individualPermissionsResult,
    workspaceMemberCount,
    userPermission,
  ] = await Promise.all([
    reportDataQuery,
    reportCollectionsQuery,
    individualPermissionsQuery,
    getOrganizationMemberCount(organizationId),
    getAssetPermission(userId, reportId, 'report_file'),
  ]);
  const reportData = reportDataResult[0];

  if (!reportData) {
    throw new Error('Report not found');
  }

  // Transform version_history from Record to array of { version_number, updated_at }
  // Convert version_history object to array and sort by version_number ascending
  const versionHistoryArray = Object.values(reportData.version_history)
    .map((version) => ({
      version_number: version.version_number,
      updated_at: version.updated_at,
    }))
    .sort((a, b) => a.version_number - b.version_number);

  //fallback for old reports
  if (versionHistoryArray.length === 0) {
    versionHistoryArray.push({
      version_number: 1,
      updated_at: reportData.created_at,
    });
  }

  // Get collections associated with this report

  const report = {
    ...reportData,
    version_number: versionHistoryArray[versionHistoryArray.length - 1]?.version_number ?? 1,
    versions: versionHistoryArray,
    collections: reportCollectionsResult,
    individual_permissions: individualPermissionsResult,
    permission: userPermission ?? 'can_view',
    workspace_member_count: workspaceMemberCount,
  };

  return report;
}

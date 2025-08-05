import { and, eq, isNull, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { assetPermissionRoleEnum, assetPermissions, assetTypeEnum } from '../../schema';

/**
 * Input schema for type safety
 */
export const GetAssetPermissionInputSchema = z.object({
  userId: z.string().uuid(),
  assetId: z.string().uuid(),
  assetType: z.enum(assetTypeEnum.enumValues),
});
export type GetAssetPermissionInput = z.infer<typeof GetAssetPermissionInputSchema>;

/**
 * Get the querying user's permission for a specific asset
 * Takes a user ID, asset ID, and asset type and returns the user's permission level for that asset
 */
export async function getAssetPermission(
  userId: string,
  assetId: string,
  assetType: GetAssetPermissionInput['assetType']
) {
  try {
    const validated = GetAssetPermissionInputSchema.parse({ userId, assetId, assetType });

    // Check for direct user permission or organization/team permission
    const result = await db
      .select({
        role: assetPermissions.role,
      })
      .from(assetPermissions)
      .where(
        and(
          eq(assetPermissions.assetId, validated.assetId),
          eq(assetPermissions.assetType, validated.assetType),
          or(
            // Direct user permission
            and(
              eq(assetPermissions.identityId, validated.userId),
              eq(assetPermissions.identityType, 'user')
            )
            // TODO: Add organization and team permission checks if needed
            // This would require joining with usersToOrganizations and usersToTeams tables
          ),
          isNull(assetPermissions.deletedAt)
        )
      )
      .orderBy(assetPermissions.createdAt)
      .limit(1);

    return result[0]?.role ?? null;
  } catch (error) {
    console.error('Error getting asset permission:', error);
    throw error;
  }
}

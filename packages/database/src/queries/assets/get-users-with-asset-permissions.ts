import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { assetPermissions, users } from '../../schema';
import { AssetPermissionRoleSchema, AssetTypeSchema, IdentityTypeSchema } from '../../schema-types';

export const GetUsersWithAssetPermissionsInputSchema = z.object({
  assetId: z.string().uuid(),
  assetType: AssetTypeSchema,
});

export type GetUsersWithAssetPermissionsInput = z.infer<
  typeof GetUsersWithAssetPermissionsInputSchema
>;

export const GetUsersWithAssetPermissionsResultSchema = z.object({
  role: AssetPermissionRoleSchema,
  email: z.string(),
  name: z.string().nullable(),
  avatar_url: z.string().nullable(),
});

export type GetUsersWithAssetPermissionsResult = z.infer<
  typeof GetUsersWithAssetPermissionsResultSchema
>;

/**
 * Get all users with direct permissions to any asset type
 * This is a generic function that works with chats, metrics, dashboards, etc.
 */
export async function getUsersWithAssetPermissions(
  input: GetUsersWithAssetPermissionsInput
): Promise<GetUsersWithAssetPermissionsResult[]> {
  const validated = GetUsersWithAssetPermissionsInputSchema.parse(input);

  const individualPermissions = await db
    .select({
      role: assetPermissions.role,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(assetPermissions)
    .innerJoin(users, eq(users.id, assetPermissions.identityId))
    .where(
      and(
        eq(assetPermissions.assetId, validated.assetId),
        eq(assetPermissions.assetType, validated.assetType),
        eq(assetPermissions.identityType, 'user'),
        isNull(assetPermissions.deletedAt)
      )
    );

  return individualPermissions.map((row) => ({
    role: row.role,
    email: row.email,
    name: row.name,
    avatar_url: row.avatarUrl,
  }));
}

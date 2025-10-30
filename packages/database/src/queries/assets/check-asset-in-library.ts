import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { userLibrary } from '../../schema';
import { type AssetType, AssetTypeSchema } from '../../schema-types';

export const CheckAssetInLibraryInputSchema = z.object({
  userId: z.string().uuid(),
  assetId: z.string().uuid(),
  assetType: AssetTypeSchema,
});

export type CheckAssetInLibraryInput = z.infer<typeof CheckAssetInLibraryInputSchema>;

/**
 * Check if an asset is in a user's library
 * Returns true if the asset exists in the user's library (deletedAt IS NULL)
 * Returns false otherwise
 */
export async function checkAssetInLibrary(input: CheckAssetInLibraryInput): Promise<boolean> {
  const validated = CheckAssetInLibraryInputSchema.parse(input);
  const { userId, assetId, assetType } = validated;

  const [result] = await db
    .select({
      userId: userLibrary.userId,
    })
    .from(userLibrary)
    .where(
      and(
        eq(userLibrary.userId, userId),
        eq(userLibrary.assetId, assetId),
        eq(userLibrary.assetType, assetType as AssetType),
        isNull(userLibrary.deletedAt)
      )
    )
    .limit(1);

  return !!result;
}

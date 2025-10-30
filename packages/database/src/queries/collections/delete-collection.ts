import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { collections } from '../../schema';

export const DeleteCollectionInputSchema = z.object({
  collectionId: z.string().uuid(),
});

export type DeleteCollectionInput = z.infer<typeof DeleteCollectionInputSchema>;

/**
 * Soft delete a collection by setting deletedAt timestamp
 */
export async function deleteCollection(collectionId: string): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    await db
      .update(collections)
      .set({
        deletedAt: now,
      })
      .where(and(eq(collections.id, collectionId), isNull(collections.deletedAt)));

    return true;
  } catch (error) {
    console.error(`Error deleting collection ${collectionId}:`, error);
    return false;
  }
}

import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { assetSearch, collections } from '../../schema';

export const UpdateCollectionInputSchema = z.object({
  collectionId: z.string().uuid(),
  name: z.string().optional(),
  description: z.string().optional(),
  userId: z.string().uuid(),
});

export type UpdateCollectionInput = z.infer<typeof UpdateCollectionInputSchema>;
export type Collection = typeof collections.$inferSelect;

/**
 * Update a collection's name and/or description
 */
export async function updateCollection(
  input: UpdateCollectionInput
): Promise<Collection | undefined> {
  const validated = UpdateCollectionInputSchema.parse(input);

  const now = new Date().toISOString();

  // Build the update object dynamically
  const updateData: {
    name?: string;
    description?: string | null;
    updatedBy: string;
    updatedAt: string;
  } = {
    updatedBy: validated.userId,
    updatedAt: now,
  };

  if (validated.name !== undefined) {
    updateData.name = validated.name;
  }

  if (validated.description !== undefined) {
    updateData.description = validated.description;
  }

  // Update the collection
  const [updatedCollection] = await db
    .update(collections)
    .set(updateData)
    .where(and(eq(collections.id, validated.collectionId), isNull(collections.deletedAt)))
    .returning();

  return updatedCollection;
}

import { z } from 'zod';
import { db } from '../../connection';
import { assetPermissions, collections } from '../../schema';

export const CreateCollectionInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export type CreateCollectionInput = z.infer<typeof CreateCollectionInputSchema>;
export type Collection = typeof collections.$inferSelect;

/**
 * Create a new collection with owner permissions and search index entry
 */
export async function createCollection(
  input: CreateCollectionInput
): Promise<Collection | undefined> {
  const validated = CreateCollectionInputSchema.parse(input);

  // Generate a UUID for the new collection
  const collectionId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Create the collection
  const [newCollection] = await db
    .insert(collections)
    .values({
      id: collectionId,
      name: validated.name,
      description: validated.description || null,
      createdBy: validated.userId,
      updatedBy: validated.userId,
      createdAt: now,
      updatedAt: now,
      organizationId: validated.organizationId,
      workspaceSharing: 'none',
    })
    .returning();

  // Create owner permission for the user
  await db.insert(assetPermissions).values({
    identityId: validated.userId,
    identityType: 'user',
    assetId: collectionId,
    assetType: 'collection',
    role: 'owner',
    createdBy: validated.userId,
    updatedBy: validated.userId,
    createdAt: now,
    updatedAt: now,
  });

  return newCollection;
}

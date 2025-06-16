import { and, eq, isNull } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../connection';
import { usersToOrganizations } from '../schema';

// Type inference from schema
export type UserToOrganization = InferSelectModel<typeof usersToOrganizations>;

/**
 * Input schemas for type safety
 */
export const GetUserOrganizationInputSchema = z.object({
  userId: z.string().uuid(),
});

export type GetUserOrganizationInput = z.infer<typeof GetUserOrganizationInputSchema>;

/**
 * Get user's organization ID and role
 * Takes a user ID and returns their organization ID and role from the users_to_organizations table
 */
export async function getUserOrganizationId(userId: string): Promise<{
  organizationId: string;
  role: string;
} | null> {
  try {
    const validated = GetUserOrganizationInputSchema.parse({ userId });

    const result = await db
      .select({
        organizationId: usersToOrganizations.organizationId,
        role: usersToOrganizations.role,
      })
      .from(usersToOrganizations)
      .where(
        and(
          eq(usersToOrganizations.userId, validated.userId),
          isNull(usersToOrganizations.deletedAt)
        )
      )
      .limit(1);

    if (!result.length || !result[0]) {
      return null;
    }

    return {
      organizationId: result[0].organizationId,
      role: result[0].role,
    };
  } catch (error) {
    console.log('error', error);
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid user organization input: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    throw error;
  }
}

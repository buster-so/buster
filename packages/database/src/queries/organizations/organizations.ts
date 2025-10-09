import type { InferSelectModel } from 'drizzle-orm';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { organizations, usersToOrganizations } from '../../schema';

// Type inference from schema
export type UserToOrganization = InferSelectModel<typeof usersToOrganizations>;
type Organization = InferSelectModel<typeof organizations>;

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

export async function getUserOrganizationId(userId: string) {
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
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid user organization input: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Get organization data by ID
 * Returns organization information including color palettes
 */

export const GetOrganizationInputSchema = z.object({
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
});

export type GetOrganizationInput = z.infer<typeof GetOrganizationInputSchema>;

export async function getOrganization(params: GetOrganizationInput): Promise<Organization> {
  try {
    const { organizationId } = GetOrganizationInputSchema.parse(params);

    const result = await db
      .select()
      .from(organizations)
      .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
      .limit(1);

    if (!result.length || !result[0]) {
      throw new Error('Organization not found');
    }

    return result[0];
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid organization input: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }

    console.error('Error fetching organization:', {
      organizationId: params.organizationId,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to fetch organization');
  }
}

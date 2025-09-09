import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { users } from '../../schema';
import type { UserSuggestedPrompts } from '../../schema-types';

// Input validation schemas
const UpdateSuggestedPromptsInputSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  suggestedPrompts: z.object({
    report: z.array(z.string()),
    dashboard: z.array(z.string()),
    visualization: z.array(z.string()),
    help: z.array(z.string()),
  }),
});

const GetSuggestedPromptsInputSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
});

type UpdateSuggestedPromptsInput = z.infer<typeof UpdateSuggestedPromptsInputSchema>;
type GetSuggestedPromptsInput = z.infer<typeof GetSuggestedPromptsInputSchema>;

/**
 * Updates the suggested prompts for a user
 */
export async function updateUserSuggestedPrompts(
  params: UpdateSuggestedPromptsInput
): Promise<UserSuggestedPrompts> {
  try {
    const { userId, suggestedPrompts } = UpdateSuggestedPromptsInputSchema.parse(params);

    const updatedPrompts: UserSuggestedPrompts = {
      suggestedPrompts: suggestedPrompts,
      updatedAt: new Date().toISOString(),
    };

    const result = await db
      .update(users)
      .set({
        suggestedPrompts: updatedPrompts,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))
      .returning({ suggestedPrompts: users.suggestedPrompts });

    if (!result.length || !result[0]) {
      throw new Error('User not found');
    }

    return result[0].suggestedPrompts;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Gets the suggested prompts for a user
 */
export async function getUserSuggestedPrompts(
  params: GetSuggestedPromptsInput
): Promise<UserSuggestedPrompts | null> {
  try {
    const { userId } = GetSuggestedPromptsInputSchema.parse(params);

    const result = await db
      .select({ suggestedPrompts: users.suggestedPrompts })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = result[0];
    return user ? user.suggestedPrompts : null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw error;
  }
}

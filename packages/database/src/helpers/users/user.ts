import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { users } from '../../schema';

export const UserInputSchema = z.object({
  id: z.string().uuid('User ID must be a valid UUID'),
});

const UserOutputSchema = z.object({
  id: z.string().uuid('User ID must be a valid UUID'),
  name: z.string().nullable(),
  email: z.string().email('Invalid email address'),
  avatarUrl: z.string().nullable(),
});

export type User = z.infer<typeof UserOutputSchema>;

export const getUser = async (input: z.infer<typeof UserInputSchema>) => {
  const validated = UserInputSchema.parse(input);

  const user: User | null = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, validated.id))
    .limit(1)
    .then((result) => result[0] || null);

  return UserOutputSchema.parse(user);
};

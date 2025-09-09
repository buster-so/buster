import { and, desc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../index';
import { messages } from '../../schema';

// Schema for the return type
export const UserRecentMessageSchema = z.object({
  id: z.string().uuid(),
  requestMessage: z.string(),
  responseMessages: z.string(),
  createdAt: z.string(),
});

export type UserRecentMessage = z.infer<typeof UserRecentMessageSchema>;

/**
 * Get the most recent 15 messages created by a specific user
 * @param userId - The ID of the user to get messages for
 * @param count - The number of messages to get
 * @returns Array of recent messages with request and response data
 */
export async function getUserRecentMessages(
  userId: string,
  count = 15
): Promise<UserRecentMessage[]> {
  const result = await db
    .select({
      id: messages.id,
      requestMessage: messages.requestMessage,
      responseMessages: messages.responseMessages,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
        // Only get messages created by the user and not soft deleted
        eq(messages.createdBy, userId),
        isNull(messages.deletedAt)
      )
    )
    .orderBy(desc(messages.createdAt))
    .limit(count);

  return result.map((msg: (typeof result)[0]) => ({
    id: msg.id,
    requestMessage: msg.requestMessage ?? '',
    responseMessages: JSON.stringify(msg.responseMessages),
    createdAt: msg.createdAt,
  }));
}

/**
 * Get the most recent messages created by a specific user with validation
 * @param userId - The ID of the user to get messages for
 * @param count - The number of messages to get
 * @returns Array of validated recent messages
 */
export async function getUserRecentMessagesValidated(
  userId: string,
  count = 15
): Promise<UserRecentMessage[]> {
  const messages = await getUserRecentMessages(userId, count);
  return z.array(UserRecentMessageSchema).parse(messages);
}

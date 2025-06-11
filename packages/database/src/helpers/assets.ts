import { and, eq, isNull } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../connection';
import { dashboardFiles, messages, messagesToFiles, metricFiles } from '../schema';

// Type inference from schema
export type Message = InferSelectModel<typeof messages>;

/**
 * Input schemas
 */
export const GenerateAssetMessagesInputSchema = z.object({
  assetId: z.string().uuid(),
  assetType: z.enum(['metric_file', 'dashboard_file']),
  userId: z.string().uuid(),
  chatId: z.string().uuid(),
});

export type GenerateAssetMessagesInput = z.infer<typeof GenerateAssetMessagesInputSchema>;

/**
 * Asset details type
 */
interface AssetDetails {
  id: string;
  name: string;
  content?: any;
  createdBy: string;
}

/**
 * Get asset details based on type
 */
async function getAssetDetails(
  assetId: string,
  assetType: 'metric_file' | 'dashboard_file'
): Promise<AssetDetails | null> {
  if (assetType === 'metric_file') {
    const [metric] = await db
      .select({
        id: metricFiles.id,
        name: metricFiles.name,
        content: metricFiles.content,
        createdBy: metricFiles.createdBy,
      })
      .from(metricFiles)
      .where(and(eq(metricFiles.id, assetId), isNull(metricFiles.deletedAt)))
      .limit(1);

    return metric || null;
  }
  if (assetType === 'dashboard_file') {
    const [dashboard] = await db
      .select({
        id: dashboardFiles.id,
        name: dashboardFiles.name,
        content: dashboardFiles.content,
        createdBy: dashboardFiles.createdBy,
      })
      .from(dashboardFiles)
      .where(and(eq(dashboardFiles.id, assetId), isNull(dashboardFiles.deletedAt)))
      .limit(1);

    return dashboard || null;
  }

  return null;
}

/**
 * Generate initial messages for an asset-based chat
 */
export async function generateAssetMessages(input: GenerateAssetMessagesInput): Promise<Message[]> {
  const validated = GenerateAssetMessagesInputSchema.parse(input);

  // Get asset details
  const asset = await getAssetDetails(validated.assetId, validated.assetType);
  if (!asset) {
    throw new Error(`Asset not found: ${validated.assetId}`);
  }

  const createdMessages: Message[] = [];

  // Create initial user message based on asset type
  const userMessageContent =
    validated.assetType === 'metric_file'
      ? `Let me help you analyze the metric "${asset.name}".`
      : `Let me help you explore the dashboard "${asset.name}".`;

  const [userMessage] = await db
    .insert(messages)
    .values({
      chatId: validated.chatId,
      createdBy: validated.userId,
      requestMessage: userMessageContent,
      responseMessages: {},
      reasoning: {},
      title: userMessageContent,
      rawLlmMessages: {},
      isCompleted: true,
    })
    .returning();

  if (userMessage) {
    createdMessages.push(userMessage);
  }

  // Create assistant message with asset context
  const assistantMessageId = crypto.randomUUID();
  const assistantContent =
    validated.assetType === 'metric_file'
      ? `I'm ready to help you analyze the metric "${asset.name}". What would you like to know about it?`
      : `I'm ready to help you explore the dashboard "${asset.name}". What would you like to understand about it?`;

  const [assistantMessage] = await db
    .insert(messages)
    .values({
      chatId: validated.chatId,
      createdBy: validated.userId,
      requestMessage: null,
      responseMessages: {
        content: assistantContent,
        role: 'assistant',
      },
      reasoning: {},
      title: assistantContent,
      rawLlmMessages: {},
      isCompleted: true,
    })
    .returning();

  if (assistantMessage) {
    createdMessages.push(assistantMessage);

    // Create file association for the assistant message
    await createMessageFileAssociation({
      messageId: assistantMessageId,
      fileId: validated.assetId,
      fileType: validated.assetType,
      version: 1,
    });
  }

  return createdMessages;
}

/**
 * Create a message-to-file association
 */
interface CreateFileAssociationInput {
  messageId: string;
  fileId: string;
  fileType: 'metric_file' | 'dashboard_file';
  version: number;
}

export async function createMessageFileAssociation(
  input: CreateFileAssociationInput
): Promise<void> {
  await db.insert(messagesToFiles).values({
    id: crypto.randomUUID(),
    messageId: input.messageId,
    fileId: input.fileId,
    versionNumber: input.version,
    isDuplicate: false,
  });
}

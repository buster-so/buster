import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';

// Schema for a conversation file - single source of truth
const ConversationSchema = z.object({
  chatId: z.string().uuid().describe('Unique chat/conversation ID'),
  workingDirectory: z.string().describe('Absolute path of the working directory'),
  createdAt: z.string().datetime().describe('ISO timestamp when conversation was created'),
  updatedAt: z.string().datetime().describe('ISO timestamp when conversation was last updated'),
  // AI SDK messages array - single source of truth for conversation state
  modelMessages: z.array(z.any()).describe('Array of CoreMessage objects (user, assistant, tool)'),
});

export type Conversation = z.infer<typeof ConversationSchema>;

// Base directory for all history
const HISTORY_DIR = join(homedir(), '.buster', 'history');

/**
 * Encodes a file path to be safe for use as a directory name
 * Uses base64 encoding to handle special characters
 */
function encodePathForDirectory(path: string): string {
  return Buffer.from(path).toString('base64url');
}

/**
 * Decodes a directory name back to the original path
 */
function decodePathFromDirectory(encoded: string): string {
  return Buffer.from(encoded, 'base64url').toString('utf-8');
}

/**
 * Gets the history directory for a specific working directory
 */
function getHistoryDir(workingDirectory: string): string {
  const encoded = encodePathForDirectory(workingDirectory);
  return join(HISTORY_DIR, encoded);
}

/**
 * Gets the file path for a specific conversation
 */
function getConversationFilePath(chatId: string, workingDirectory: string): string {
  return join(getHistoryDir(workingDirectory), `${chatId}.json`);
}

/**
 * Ensures the history directory exists for a given working directory
 */
async function ensureHistoryDir(workingDirectory: string): Promise<void> {
  const dir = getHistoryDir(workingDirectory);
  await mkdir(dir, { recursive: true, mode: 0o700 });
}

/**
 * Creates a new conversation
 */
export async function createConversation(
  chatId: string,
  workingDirectory: string
): Promise<Conversation> {
  await ensureHistoryDir(workingDirectory);

  const conversation: Conversation = {
    chatId,
    workingDirectory,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modelMessages: [],
  };

  const filePath = getConversationFilePath(chatId, workingDirectory);
  await writeFile(filePath, JSON.stringify(conversation, null, 2), { mode: 0o600 });

  return conversation;
}

/**
 * Loads a conversation from disk
 * Returns null if the conversation doesn't exist
 */
export async function loadConversation(
  chatId: string,
  workingDirectory: string
): Promise<Conversation | null> {
  try {
    const filePath = getConversationFilePath(chatId, workingDirectory);
    const data = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return ConversationSchema.parse(parsed);
  } catch (error) {
    // File doesn't exist or is invalid
    return null;
  }
}

/**
 * Saves the full model messages array (single source of truth)
 */
export async function saveModelMessages(
  chatId: string,
  workingDirectory: string,
  modelMessages: any[]
): Promise<void> {
  let conversation = await loadConversation(chatId, workingDirectory);

  if (!conversation) {
    // Create new conversation if it doesn't exist
    conversation = await createConversation(chatId, workingDirectory);
  }

  // Replace the model messages with the new array
  conversation.modelMessages = modelMessages as any[];
  conversation.updatedAt = new Date().toISOString();

  // Save back to disk
  const filePath = getConversationFilePath(chatId, workingDirectory);
  await writeFile(filePath, JSON.stringify(conversation, null, 2), { mode: 0o600 });
}

/**
 * Lists all conversations for a given working directory
 * Returns array of conversation metadata sorted by most recent first
 */
export async function listConversations(
  workingDirectory: string
): Promise<Array<{ chatId: string; createdAt: string; updatedAt: string; messageCount: number }>> {
  try {
    const dir = getHistoryDir(workingDirectory);
    const files = await readdir(dir);

    const conversations = await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .map(async (file) => {
          const chatId = file.replace('.json', '');
          const conversation = await loadConversation(chatId, workingDirectory);
          if (!conversation) return null;

          return {
            chatId: conversation.chatId,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            messageCount: conversation.modelMessages.length,
          };
        })
    );

    // Filter out nulls and sort by most recent first
    return conversations
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    // Directory doesn't exist or can't be read
    return [];
  }
}

/**
 * Gets the most recent conversation for a working directory
 * Returns null if no conversations exist
 */
export async function getLatestConversation(
  workingDirectory: string
): Promise<Conversation | null> {
  const conversations = await listConversations(workingDirectory);

  if (conversations.length === 0) {
    return null;
  }

  const latest = conversations[0];
  if (!latest) {
    return null;
  }
  return loadConversation(latest.chatId, workingDirectory);
}

/**
 * Deletes a conversation
 */
export async function deleteConversation(chatId: string, workingDirectory: string): Promise<void> {
  const filePath = getConversationFilePath(chatId, workingDirectory);
  const { unlink } = await import('node:fs/promises');
  await unlink(filePath);
}

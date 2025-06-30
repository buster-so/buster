import { db, messagesToFiles } from '@buster/database';

export interface FileTrackingInput {
  messageId: string;
  files: Array<{
    id: string;
    version?: number;
  }>;
}

/**
 * Track file associations with a message in the messages_to_files table
 * This function is resilient to errors and will not throw if tracking fails
 */
export async function trackFileAssociations(input: FileTrackingInput): Promise<void> {
  const { messageId, files } = input;
  
  // Skip if no messageId or files
  if (!messageId || !files || files.length === 0) {
    return;
  }

  try {
    const fileRecords = files.map(file => ({
      id: crypto.randomUUID(),
      messageId,
      fileId: file.id,
      versionNumber: file.version || 1,
      isDuplicate: false,
    }));
    
    await db.insert(messagesToFiles).values(fileRecords);
    console.info(`Tracked ${fileRecords.length} file(s) for message ${messageId}`);
  } catch (error) {
    // Log but don't fail the operation
    console.error('Failed to track file associations:', error);
  }
}
import type { TextStreamPart, ToolSet } from 'ai';
import type { ChunkProcessor } from '../database/chunkProcessor';

/**
 * Creates an onChunk callback handler for agent streams
 */
export const createOnChunkHandler = ({
  chunkProcessor,
  abortController,
  finishingToolNames,
  onFinishingTool,
}: {
  chunkProcessor: ChunkProcessor;
  abortController: AbortController;
  finishingToolNames: string[];
  onFinishingTool?: () => void;
}) => {
  return async (event: { chunk: TextStreamPart<ToolSet> }) => {
    // Process chunk and save to database in real-time
    await chunkProcessor.processChunk(event.chunk);

    // Check if we should abort based on finishing tools
    const finishingToolName = chunkProcessor.getFinishingToolName();
    if (
      chunkProcessor.hasFinishingTool() &&
      finishingToolName &&
      finishingToolNames.includes(finishingToolName)
    ) {
      // Execute optional callback
      if (onFinishingTool) {
        onFinishingTool();
      }

      // Add a delay to ensure any pending processing completes
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Abort the stream
      try {
        abortController.abort();
      } catch (abortError) {
        console.error('Failed to abort controller:', abortError);
      }
    }
  };
};

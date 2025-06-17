import type { StreamingResult, ToolAccumulator } from './types';

export class ToolArgsParser {
  private accumulators = new Map<string, ToolAccumulator>();
  private parsers = new Map<string, (text: string) => unknown>();

  /**
   * Register a tool's streaming parser function
   */
  registerParser(toolName: string, parseFunction: (text: string) => unknown) {
    this.parsers.set(toolName, parseFunction);
  }

  /**
   * Process a chunk from the stream
   */
  processChunk(chunk: unknown): StreamingResult | null {
    // Type guard to ensure chunk has expected structure
    if (!chunk || typeof chunk !== 'object') return null;
    const chunkObj = chunk as Record<string, unknown>;

    if (chunkObj.type === 'tool-call-streaming-start') {
      const accumulator: ToolAccumulator = {
        toolName: String(chunkObj.toolName || ''),
        toolCallId: String(chunkObj.toolCallId || ''),
        rawText: '',
      };
      this.accumulators.set(accumulator.toolCallId, accumulator);
      return null;
    }

    if (chunkObj.type === 'tool-call-delta') {
      const toolCallId = String(chunkObj.toolCallId || '');
      const accumulator = this.accumulators.get(toolCallId);
      if (!accumulator) return null;

      // Add the delta text
      accumulator.rawText += String(chunkObj.argsTextDelta || '');

      // Get the parser for this tool
      const parser = this.parsers.get(accumulator.toolName);
      if (!parser) return null;

      try {
        // Try optimistic parsing
        const partialArgs = parser(accumulator.rawText);
        if (!partialArgs) return null;

        return {
          toolName: accumulator.toolName,
          toolCallId: accumulator.toolCallId,
          partialArgs: partialArgs as Partial<Record<string, unknown>>,
          isComplete: this.isJsonComplete(accumulator.rawText),
        };
      } catch (error) {
        // Only throw if it's a legitimate error, not a parsing error
        if (
          error instanceof Error &&
          !error.message.includes('JSON') &&
          !error.message.includes('parse')
        ) {
          throw error;
        }
        return null;
      }
    }

    // Clean up completed tool calls
    if (chunkObj.type === 'tool-result') {
      const toolCallId = String(chunkObj.toolCallId || '');
      this.accumulators.delete(toolCallId);
    }

    return null;
  }

  /**
   * Check if the accumulated JSON appears to be complete
   */
  private isJsonComplete(text: string): boolean {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all accumulators (useful for testing)
   */
  clear() {
    this.accumulators.clear();
  }
}

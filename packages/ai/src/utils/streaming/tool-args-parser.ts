import type { StreamingResult, ToolAccumulator } from './types';

export class ToolArgsParser {
  private accumulators = new Map<string, ToolAccumulator>();
  private parsers = new Map<string, (text: string) => any>();

  /**
   * Register a tool's streaming parser function
   */
  registerParser(toolName: string, parseFunction: (text: string) => any) {
    this.parsers.set(toolName, parseFunction);
  }

  /**
   * Process a chunk from the stream
   */
  processChunk(chunk: any): StreamingResult | null {
    if (chunk.type === 'tool-call-streaming-start') {
      const accumulator: ToolAccumulator = {
        toolName: chunk.toolName,
        toolCallId: chunk.toolCallId,
        rawText: '',
      };
      this.accumulators.set(chunk.toolCallId, accumulator);
      return null;
    }

    if (chunk.type === 'tool-call-delta') {
      const accumulator = this.accumulators.get(chunk.toolCallId);
      if (!accumulator) return null;

      // Add the delta text
      accumulator.rawText += chunk.argsTextDelta || '';

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
          partialArgs,
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
    if (chunk.type === 'tool-result') {
      this.accumulators.delete(chunk.toolCallId);
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

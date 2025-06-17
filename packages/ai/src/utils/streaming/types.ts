export interface StreamingResult<T = Record<string, unknown>> {
  toolName: string;
  toolCallId: string;
  partialArgs: Partial<T>;
  isComplete: boolean;
}

export interface ToolStreamingParser<T = Record<string, unknown>> {
  parseStreamingArgs(accumulatedText: string): Partial<T> | null;
}

export interface ToolAccumulator {
  toolName: string;
  toolCallId: string;
  rawText: string;
}

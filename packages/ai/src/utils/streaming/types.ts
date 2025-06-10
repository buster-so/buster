export interface StreamingResult<T = any> {
  toolName: string;
  toolCallId: string;
  partialArgs: Partial<T>;
  isComplete: boolean;
}

export interface ToolStreamingParser<T = any> {
  parseStreamingArgs(accumulatedText: string): Partial<T> | null;
}

export interface ToolAccumulator {
  toolName: string;
  toolCallId: string;
  rawText: string;
}

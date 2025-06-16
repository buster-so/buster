import { updateMessageFields } from '@buster/database';
import type { CoreMessage, TextStreamPart, ToolSet } from 'ai';
import type { z } from 'zod';
import { extractResponseMessages } from './formatLlmMessagesAsReasoning';

/**
 * AI SDK Type Safety Patterns:
 * 
 * 1. TextStreamPart<TOOLS> - Use ToolSet for generic tool support
 * 2. CoreMessage content arrays - Use specific content part types
 * 3. Tool calls/results - Use proper generic types with constraints
 * 
 * This implementation provides type-safe streaming chunk processing
 * while maintaining compatibility with AI SDK's type system.
 */

// Define the reasoning and response types
type ReasoningEntry = z.infer<typeof import('../memory/types').BusterChatMessageReasoningSchema>;
type ResponseEntry = z.infer<typeof import('../memory/types').BusterChatMessageResponseSchema>;

interface ToolCallInProgress {
  toolCallId: string;
  toolName: string;
  argsText: string;
  args?: Record<string, unknown>;
}

// Content types for assistant messages
type AssistantMessageContent =
  | { type: 'text'; text: string }
  | { type: 'tool-call'; toolCallId: string; toolName: string; args: Record<string, unknown> };

// Generic tool result type for chunk processing
type GenericToolResult = {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  result: unknown;
};

interface ChunkProcessorState {
  // Accumulated messages that form the conversation
  accumulatedMessages: CoreMessage[];

  // Current assistant message being built
  currentAssistantMessage: {
    role: 'assistant';
    content: AssistantMessageContent[];
  } | null;

  // Tool calls currently being streamed
  toolCallsInProgress: Map<string, ToolCallInProgress>;

  // Accumulated reasoning and response history
  reasoningHistory: ReasoningEntry[];
  responseHistory: ResponseEntry[];

  // Track if we've seen certain finishing tools
  hasFinishingTool: boolean;
  finishedToolName?: string;

  // Track the index of last processed message to avoid re-processing
  lastProcessedMessageIndex: number;

  // Track timing for secondary_title
  timing: {
    startTime?: number;
    toolCallTimings: Map<string, number>; // toolCallId -> completion time
  };
}

export class ChunkProcessor {
  private state: ChunkProcessorState;
  private messageId: string | null;
  private lastSaveTime = 0;
  private readonly SAVE_THROTTLE_MS = 100; // Throttle saves to every 100ms

  constructor(
    messageId: string | null,
    initialMessages: CoreMessage[] = [],
    initialReasoningHistory: ReasoningEntry[] = [],
    initialResponseHistory: ResponseEntry[] = []
  ) {
    this.messageId = messageId;
    this.state = {
      accumulatedMessages: [...initialMessages],
      currentAssistantMessage: null,
      toolCallsInProgress: new Map(),
      reasoningHistory: [...initialReasoningHistory],
      responseHistory: [...initialResponseHistory],
      hasFinishingTool: false,
      lastProcessedMessageIndex: initialMessages.length - 1, // Already processed initial messages
      timing: {
        toolCallTimings: new Map(),
      },
    };
  }

  /**
   * Process a chunk and potentially save to database
   */
  async processChunk(chunk: TextStreamPart<ToolSet> | GenericToolResult): Promise<void> {
    switch (chunk.type) {
      case 'text-delta':
        this.handleTextDelta(chunk as Extract<TextStreamPart<ToolSet>, { type: 'text-delta' }>);
        break;

      case 'tool-call':
        // Complete tool call with args already available
        this.handleToolCall(chunk as Extract<TextStreamPart<ToolSet>, { type: 'tool-call' }>);
        break;

      case 'tool-call-streaming-start':
        this.handleToolCallStart(
          chunk as Extract<TextStreamPart<ToolSet>, { type: 'tool-call-streaming-start' }>
        );
        break;

      case 'tool-call-delta':
        this.handleToolCallDelta(
          chunk as Extract<TextStreamPart<ToolSet>, { type: 'tool-call-delta' }>
        );
        break;

      case 'tool-result':
        await this.handleToolResult(chunk as GenericToolResult);
        break;

      case 'step-finish':
        await this.handleStepFinish();
        break;

      case 'finish':
        await this.handleFinish();
        break;
    }

    // Save to database if enough time has passed (throttled)
    await this.saveIfNeeded();
  }

  private handleTextDelta(chunk: Extract<TextStreamPart<ToolSet>, { type: 'text-delta' }>) {
    if (!this.state.currentAssistantMessage) {
      this.state.currentAssistantMessage = {
        role: 'assistant',
        content: [],
      };
    }

    // Find or create text content part
    let textPart = this.state.currentAssistantMessage.content.find(
      (part): part is { type: 'text'; text: string } => part.type === 'text'
    );

    if (!textPart) {
      textPart = { type: 'text', text: '' };
      this.state.currentAssistantMessage.content.push(textPart);
    }

    textPart.text += chunk.textDelta || '';
  }

  private handleToolCall(chunk: Extract<TextStreamPart<ToolSet>, { type: 'tool-call' }>) {
    if (!this.state.currentAssistantMessage) {
      this.state.currentAssistantMessage = {
        role: 'assistant',
        content: [],
      };
    }

    const toolCall: AssistantMessageContent = {
      type: 'tool-call',
      toolCallId: chunk.toolCallId,
      toolName: chunk.toolName,
      args: chunk.args || {},
    };

    this.state.currentAssistantMessage.content.push(toolCall);

    // Start timing on first tool call
    if (!this.state.timing.startTime) {
      this.state.timing.startTime = Date.now();
    }

    // Create reasoning entry for this tool call
    const reasoningEntry = this.createReasoningEntry(
      chunk.toolCallId,
      chunk.toolName,
      chunk.args || {}
    );
    if (reasoningEntry) {
      // Check if this reasoning entry already exists (avoid duplicates)
      const existingEntry = this.state.reasoningHistory.find(
        (r) => r && typeof r === 'object' && 'id' in r && r.id === chunk.toolCallId
      );

      if (!existingEntry) {
        this.state.reasoningHistory.push(reasoningEntry);
      }
    }

    // Check if this is a finishing tool
    if (['doneTool', 'respondWithoutAnalysis', 'submitThoughts'].includes(chunk.toolName)) {
      this.state.hasFinishingTool = true;
      this.state.finishedToolName = chunk.toolName;
    }
  }

  private handleToolCallStart(
    chunk: Extract<TextStreamPart<ToolSet>, { type: 'tool-call-streaming-start' }>
  ) {
    if (!this.state.currentAssistantMessage) {
      this.state.currentAssistantMessage = {
        role: 'assistant',
        content: [],
      };
    }

    const toolCall: AssistantMessageContent = {
      type: 'tool-call',
      toolCallId: chunk.toolCallId,
      toolName: chunk.toolName,
      args: {},
    };

    this.state.currentAssistantMessage.content.push(toolCall);

    // Start timing on first tool call
    if (!this.state.timing.startTime) {
      this.state.timing.startTime = Date.now();
    }

    // Track the tool call in progress
    this.state.toolCallsInProgress.set(chunk.toolCallId, {
      toolCallId: chunk.toolCallId,
      toolName: chunk.toolName,
      argsText: '',
    });

    // Check if this is a finishing tool
    if (['doneTool', 'respondWithoutAnalysis', 'submitThoughts'].includes(chunk.toolName)) {
      this.state.hasFinishingTool = true;
      this.state.finishedToolName = chunk.toolName;
    }
  }

  private handleToolCallDelta(
    chunk: Extract<TextStreamPart<ToolSet>, { type: 'tool-call-delta' }>
  ) {
    const inProgress = this.state.toolCallsInProgress.get(chunk.toolCallId);
    if (!inProgress) return;

    // Accumulate the arguments text
    inProgress.argsText += chunk.argsTextDelta || '';

    // Try to parse the JSON
    try {
      inProgress.args = JSON.parse(inProgress.argsText);

      // Update the tool call in the assistant message
      if (this.state.currentAssistantMessage) {
        const toolCall = this.state.currentAssistantMessage.content.find(
          (
            part
          ): part is {
            type: 'tool-call';
            toolCallId: string;
            toolName: string;
            args: Record<string, unknown>;
          } =>
            part.type === 'tool-call' &&
            'toolCallId' in part &&
            part.toolCallId === chunk.toolCallId
        );
        if (toolCall) {
          toolCall.args = inProgress.args;
        }
      }

      // Create reasoning entry if not already created
      const existingEntry = this.state.reasoningHistory.find(
        (r) => r && typeof r === 'object' && 'id' in r && r.id === chunk.toolCallId
      );

      if (!existingEntry && inProgress.args) {
        const reasoningEntry = this.createReasoningEntry(
          chunk.toolCallId,
          inProgress.toolName,
          inProgress.args
        );
        if (reasoningEntry) {
          this.state.reasoningHistory.push(reasoningEntry);
        }
      }
    } catch {
      // JSON is incomplete, continue accumulating
    }
  }

  private async handleToolResult(chunk: GenericToolResult) {
    // Finalize current assistant message if exists
    if (this.state.currentAssistantMessage) {
      this.state.accumulatedMessages.push(
        this.state.currentAssistantMessage as unknown as CoreMessage
      );
      this.state.currentAssistantMessage = null;
    }

    // Add tool result message
    const toolResultMessage: CoreMessage = {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          result: chunk.result,
        },
      ],
    };

    this.state.accumulatedMessages.push(toolResultMessage);

    // Track tool completion timing and update reasoning entry
    if (this.state.timing.startTime) {
      const completedAt = Date.now();
      const cumulativeTime = completedAt - this.state.timing.startTime;
      this.state.timing.toolCallTimings.set(chunk.toolCallId, cumulativeTime);

      // Determine if the tool succeeded or failed based on the result
      const status = this.determineToolStatus(chunk.result);

      // Update the specific reasoning entry for this tool call
      this.updateReasoningEntryStatus(chunk.toolCallId, status, cumulativeTime);
    }

    // Clear the tool call from tracking
    this.state.toolCallsInProgress.delete(chunk.toolCallId);

    // Force save after tool result
    await this.saveToDatabase();
  }

  private async handleStepFinish() {
    // Finalize any current assistant message
    if (this.state.currentAssistantMessage) {
      this.state.accumulatedMessages.push(
        this.state.currentAssistantMessage as unknown as CoreMessage
      );
      this.state.currentAssistantMessage = null;
    }

    // Force save on step finish
    await this.saveToDatabase();
  }

  private async handleFinish() {
    // Finalize any current assistant message
    if (this.state.currentAssistantMessage) {
      this.state.accumulatedMessages.push(
        this.state.currentAssistantMessage as unknown as CoreMessage
      );
      this.state.currentAssistantMessage = null;
    }

    // Force final save
    await this.saveToDatabase();
  }

  private async saveIfNeeded() {
    const now = Date.now();
    if (now - this.lastSaveTime >= this.SAVE_THROTTLE_MS) {
      await this.saveToDatabase();
    }
  }

  private async saveToDatabase() {
    if (!this.messageId) {
      return;
    }

    try {
      // Build messages including current assistant message if in progress
      const allMessages = [...this.state.accumulatedMessages];
      if (this.state.currentAssistantMessage) {
        allMessages.push(this.state.currentAssistantMessage as unknown as CoreMessage);
      }

      // Don't save if we have no messages
      if (allMessages.length === 0) {
        return;
      }

      // Only process messages that haven't been processed yet
      const messagesToProcess = allMessages.slice(this.state.lastProcessedMessageIndex + 1);

      // Extract response messages from NEW messages only
      const newResponseEntries = extractResponseMessages(messagesToProcess) as ResponseEntry[];

      // Update response history with new entries
      const existingResponseIds = new Set(
        this.state.responseHistory
          .filter((r): r is { id: string } => r !== null && typeof r === 'object' && 'id' in r)
          .map((r) => r.id)
      );

      const deduplicatedNewResponses = newResponseEntries.filter(
        (entry) => entry && 'id' in entry && !existingResponseIds.has(entry.id)
      );

      if (deduplicatedNewResponses.length > 0) {
        this.state.responseHistory.push(...deduplicatedNewResponses);
      }

      // Update database with all fields
      const updateFields: {
        rawLlmMessages: CoreMessage[];
        reasoning: ReasoningEntry[];
        responseMessages?: ResponseEntry[];
      } = {
        rawLlmMessages: allMessages,
        reasoning: this.state.reasoningHistory,
      };

      if (this.state.responseHistory.length > 0) {
        updateFields.responseMessages = this.state.responseHistory;
      }

      await updateMessageFields(this.messageId, updateFields);

      this.lastSaveTime = Date.now();

      // Update the last processed index to avoid re-processing these messages
      // If current assistant message exists, it's still in progress, so don't include it
      this.state.lastProcessedMessageIndex = this.state.currentAssistantMessage
        ? allMessages.length - 2 // Exclude the current in-progress message
        : allMessages.length - 1;
    } catch (error) {
      console.error('Error saving chunk to database:', error);
      // Don't throw - we want to continue processing even if save fails
    }
  }

  /**
   * Determine tool status based on result
   */
  private determineToolStatus(result: unknown): 'completed' | 'failed' {
    try {
      // If result is a string, check for error indicators
      if (typeof result === 'string') {
        const lowerResult = result.toLowerCase();
        if (
          lowerResult.includes('error') ||
          lowerResult.includes('failed') ||
          lowerResult.includes('exception')
        ) {
          return 'failed';
        }
      }

      // If result is an object, check for error properties
      if (result && typeof result === 'object') {
        const resultObj = result as Record<string, unknown>;
        if (resultObj.error || resultObj.success === false || resultObj.status === 'error') {
          return 'failed';
        }
      }

      return 'completed';
    } catch {
      // If we can't determine, default to completed
      return 'completed';
    }
  }

  /**
   * Update a specific reasoning entry's status and timing
   */
  private updateReasoningEntryStatus(
    toolCallId: string,
    status: 'loading' | 'completed' | 'failed',
    timing?: number
  ): void {
    const entry = this.state.reasoningHistory.find(
      (r) => r && typeof r === 'object' && 'id' in r && r.id === toolCallId
    );

    if (entry && typeof entry === 'object') {
      // Type-safe update of status
      if ('status' in entry) {
        (entry as { status: 'loading' | 'completed' | 'failed' }).status = status;
      }

      // Update file statuses if this is a file-type entry
      if ('files' in entry && entry.files && typeof entry.files === 'object') {
        const files = entry.files as Record<
          string,
          { status?: 'loading' | 'completed' | 'failed' }
        >;
        for (const fileId in files) {
          if (files[fileId] && typeof files[fileId] === 'object') {
            files[fileId].status = status;
          }
        }
      }

      if (timing && 'secondary_title' in entry) {
        const seconds = timing / 1000;
        const entryWithTitle = entry as { secondary_title?: string };
        if (seconds >= 60) {
          const minutes = Math.round(seconds / 60);
          entryWithTitle.secondary_title = `${minutes}m`;
        } else {
          entryWithTitle.secondary_title = `${seconds.toFixed(1)}s`;
        }
      }
    }
  }

  /**
   * Create a reasoning entry for a tool call
   */
  private createReasoningEntry(
    toolCallId: string,
    toolName: string,
    args: Record<string, unknown>
  ): ReasoningEntry | null {
    // Skip response/communication tools - these don't belong in reasoning
    const responseTools = [
      'doneTool',
      'done-tool',
      'respondWithoutAnalysis',
      'respond-without-analysis',
    ];

    if (responseTools.includes(toolName)) {
      return null;
    }

    switch (toolName) {
      case 'sequentialThinking':
      case 'sequential-thinking':
        if (args.thought) {
          return {
            id: toolCallId,
            type: 'text',
            title: 'Thinking...',
            status: 'loading',
            message: args.thought,
            message_chunk: null,
            secondary_title: undefined,
            finished_reasoning: !args.nextThoughtNeeded,
          } as ReasoningEntry;
        }
        break;

      case 'createMetrics':
      case 'create-metrics-file':
        if (args.files && Array.isArray(args.files)) {
          const files: Record<string, unknown> = {};
          const fileIds: string[] = [];

          for (const file of args.files) {
            const fileId = crypto.randomUUID();
            fileIds.push(fileId);
            files[fileId] = {
              id: fileId,
              file_type: 'metric',
              file_name: file.name || 'untitled_metric.yml',
              version_number: 1,
              status: 'loading',
              file: {
                text: file.yml_content || '',
                text_chunk: undefined,
                modified: undefined,
              },
            };
          }

          return {
            id: toolCallId,
            type: 'files',
            title: `Creating ${args.files.length} metric${args.files.length === 1 ? '' : 's'}`,
            status: 'loading',
            secondary_title: undefined,
            file_ids: fileIds,
            files,
          } as ReasoningEntry;
        }
        break;

      case 'executeSql':
      case 'execute-sql':
        if (args.queries && Array.isArray(args.queries)) {
          const queryText = args.queries
            .map((q: unknown) => {
              if (typeof q === 'object' && q !== null && 'sql' in q) {
                return (q as { sql: string }).sql;
              }
              return String(q);
            })
            .join('\n\n');
          return {
            id: toolCallId,
            type: 'text',
            title: 'Executing SQL',
            status: 'loading',
            message: queryText,
            message_chunk: null,
            secondary_title: undefined,
            finished_reasoning: false,
          } as ReasoningEntry;
        } else if (args.sql) {
          return {
            id: toolCallId,
            type: 'text',
            title: 'Executing SQL',
            status: 'loading',
            message: args.sql,
            message_chunk: null,
            secondary_title: undefined,
            finished_reasoning: false,
          } as ReasoningEntry;
        }
        break;

      case 'submitThoughts':
        if (args.thoughts) {
          return {
            id: toolCallId,
            type: 'text',
            title: 'Submitting Analysis',
            status: 'loading',
            message: args.thoughts,
            message_chunk: null,
            secondary_title: undefined,
            finished_reasoning: false,
          } as ReasoningEntry;
        }
        break;

      default:
        // For other tools, create a generic text entry
        let messageContent: string;
        try {
          messageContent = JSON.stringify(args, null, 2);
        } catch {
          messageContent = '[Unable to display tool arguments]';
        }

        return {
          id: toolCallId,
          type: 'text',
          title: toolName,
          status: 'loading',
          message: messageContent,
          message_chunk: null,
          secondary_title: undefined,
          finished_reasoning: false,
        } as ReasoningEntry;
    }

    return null;
  }

  /**
   * Set initial accumulated messages
   */
  setInitialMessages(messages: CoreMessage[]): void {
    this.state.accumulatedMessages = [...messages];
  }

  /**
   * Get the current state for inspection
   */
  getState(): ChunkProcessorState {
    return this.state;
  }

  /**
   * Check if a finishing tool has been called
   */
  hasFinishingTool(): boolean {
    return this.state.hasFinishingTool;
  }

  /**
   * Get the finishing tool name if any
   */
  getFinishingToolName(): string | undefined {
    return this.state.finishedToolName;
  }

  /**
   * Get the accumulated messages
   */
  getAccumulatedMessages(): CoreMessage[] {
    const messages = [...this.state.accumulatedMessages];
    if (this.state.currentAssistantMessage) {
      messages.push(this.state.currentAssistantMessage as unknown as CoreMessage);
    }
    return messages;
  }

  /**
   * Get the reasoning history
   */
  getReasoningHistory(): ReasoningEntry[] {
    return this.state.reasoningHistory;
  }

  /**
   * Get the response history
   */
  getResponseHistory(): ResponseEntry[] {
    return this.state.responseHistory;
  }

  /**
   * Get timing data for debugging
   */
  getTimingData(): { startTime?: number; completedTools: number } {
    return {
      startTime: this.state.timing.startTime,
      completedTools: this.state.timing.toolCallTimings.size,
    };
  }
}

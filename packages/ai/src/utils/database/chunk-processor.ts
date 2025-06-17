import { updateMessageFields } from '@buster/database';
import type { CoreMessage, TextStreamPart, ToolSet } from 'ai';
import type { z } from 'zod';
import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '../../../../../server/src/types/chat-types/chat-message.type';
import { OptimisticJsonParser, getOptimisticValue } from '../streaming/optimistic-json-parser';
import { extractResponseMessages } from './formatLlmMessagesAsReasoning';
import type {
  AssistantMessageContent,
  GenericToolSet,
  TextDeltaChunk,
  ToolCallChunk,
  ToolCallDeltaChunk,
  ToolCallInProgress,
  ToolCallStreamingStartChunk,
  ToolResultChunk,
  TypedAssistantMessage,
} from './types';
import {
  determineToolStatus,
  extractSqlFromQuery,
  hasFiles,
  hasSecondaryTitle,
  hasStatus,
  isCreateMetricsArgs,
  isExecuteSqlArgs,
  isSequentialThinkingArgs,
  isSubmitThoughtsArgs,
  isTextContent,
  isToolCallContent,
} from './types';

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

// Define the reasoning and response types using the proper chat message types
type ReasoningEntry = ChatMessageReasoningMessage;
type ResponseEntry = ChatMessageResponseMessage;

// Type definitions moved to ./types.ts for reusability

interface ChunkProcessorState {
  // Accumulated messages that form the conversation
  accumulatedMessages: CoreMessage[];

  // Current assistant message being built
  currentAssistantMessage: TypedAssistantMessage | null;

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

export class ChunkProcessor<T extends ToolSet = GenericToolSet> {
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
  async processChunk(chunk: TextStreamPart<T>): Promise<void> {
    switch (chunk.type) {
      case 'text-delta':
        this.handleTextDelta(chunk);
        break;

      case 'tool-call':
        // Complete tool call with args already available
        this.handleToolCall(chunk);
        break;

      case 'tool-call-streaming-start':
        this.handleToolCallStart(chunk);
        break;

      case 'tool-call-delta':
        this.handleToolCallDelta(chunk);
        break;

      case 'tool-result':
        await this.handleToolResult(chunk);
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

  private handleTextDelta(chunk: TextStreamPart<T>) {
    if (chunk.type !== 'text-delta') return;
    if (!this.state.currentAssistantMessage) {
      this.state.currentAssistantMessage = {
        role: 'assistant',
        content: [],
      };
    }

    // Find or create text content part
    let textPart = this.state.currentAssistantMessage.content.find(isTextContent);

    if (!textPart) {
      textPart = { type: 'text', text: '' };
      this.state.currentAssistantMessage.content.push(textPart);
    }

    textPart.text += chunk.textDelta || '';
  }

  private handleToolCall(chunk: TextStreamPart<T>) {
    if (chunk.type !== 'tool-call') return;
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

    // Check if this is a response tool
    if (this.isResponseTool(chunk.toolName)) {
      // Create response entry for this tool call
      const parseResult = {
        parsed: chunk.args || {},
        isComplete: true,
        extractedValues: new Map(Object.entries(chunk.args || {})),
      };

      const responseEntry = this.createResponseEntry(chunk.toolCallId, chunk.toolName, parseResult);

      if (responseEntry) {
        // Check if this response entry already exists (avoid duplicates)
        const existingEntry = this.state.responseHistory.find(
          (r) => r && typeof r === 'object' && 'id' in r && r.id === chunk.toolCallId
        );

        if (!existingEntry) {
          this.state.responseHistory.push(responseEntry);
        }
      }
    } else {
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
    }

    // Check if this is a finishing tool
    if (['doneTool', 'respondWithoutAnalysis', 'submitThoughts'].includes(chunk.toolName)) {
      this.state.hasFinishingTool = true;
      this.state.finishedToolName = chunk.toolName;
    }
  }

  private handleToolCallStart(chunk: TextStreamPart<T>) {
    if (chunk.type !== 'tool-call-streaming-start') return;
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

    // For response tools, don't create entry until we have content
    // For reasoning tools, we can create the entry immediately
    if (!this.isResponseTool(chunk.toolName)) {
      // Create initial reasoning entry for non-response tools
      const reasoningEntry = this.createReasoningEntry(
        chunk.toolCallId,
        chunk.toolName,
        {} // Empty args initially
      );
      if (reasoningEntry) {
        this.state.reasoningHistory.push(reasoningEntry);
      }
    }

    // Check if this is a finishing tool
    if (['doneTool', 'respondWithoutAnalysis', 'submitThoughts'].includes(chunk.toolName)) {
      this.state.hasFinishingTool = true;
      this.state.finishedToolName = chunk.toolName;
    }
  }

  private handleToolCallDelta(chunk: TextStreamPart<T>) {
    if (chunk.type !== 'tool-call-delta') return;
    const inProgress = this.state.toolCallsInProgress.get(chunk.toolCallId);
    if (!inProgress) return;

    // Accumulate the arguments text
    inProgress.argsText += chunk.argsTextDelta || '';

    // Use optimistic parsing to extract values even from incomplete JSON
    const parseResult = OptimisticJsonParser.parse(inProgress.argsText);

    // Update args with either complete parse or optimistic parse
    if (parseResult.isComplete && parseResult.parsed) {
      // Complete valid JSON
      inProgress.args = parseResult.parsed;
    } else if (parseResult.parsed) {
      // Optimistically parsed JSON
      inProgress.args = parseResult.parsed;
    }

    // Update the tool call in the assistant message
    if (this.state.currentAssistantMessage && inProgress.args) {
      const toolCall = this.state.currentAssistantMessage.content.find(
        (part): part is typeof part & { toolCallId: string } =>
          isToolCallContent(part) && part.toolCallId === chunk.toolCallId
      );
      if (toolCall && isToolCallContent(toolCall)) {
        toolCall.args = inProgress.args;
      }
    }

    // Check if this is a response tool
    const isResponseTool = this.isResponseTool(inProgress.toolName);

    if (isResponseTool) {
      // Handle response tools (doneTool, respondWithoutAnalysis)
      const existingResponse = this.state.responseHistory.find(
        (r) => r && typeof r === 'object' && 'id' in r && r.id === chunk.toolCallId
      );

      if (existingResponse) {
        // Update existing response entry with optimistically parsed values
        this.updateResponseEntryWithOptimisticValues(
          existingResponse,
          inProgress.toolName,
          parseResult
        );
      } else {
        // Create new response entry
        const responseEntry = this.createResponseEntry(
          chunk.toolCallId,
          inProgress.toolName,
          parseResult
        );
        if (responseEntry) {
          this.state.responseHistory.push(responseEntry);
        }
      }
    } else {
      // Handle reasoning tools
      const existingEntry = this.state.reasoningHistory.find(
        (r) => r && typeof r === 'object' && 'id' in r && r.id === chunk.toolCallId
      );

      if (existingEntry) {
        // Update existing entry with optimistically parsed values
        this.updateReasoningEntryWithOptimisticValues(
          existingEntry,
          inProgress.toolName,
          parseResult
        );
      } else if (inProgress.args) {
        // Create new reasoning entry
        const reasoningEntry = this.createReasoningEntry(
          chunk.toolCallId,
          inProgress.toolName,
          inProgress.args
        );
        if (reasoningEntry) {
          this.state.reasoningHistory.push(reasoningEntry);
        }
      }
    }
  }

  private async handleToolResult(chunk: TextStreamPart<T>) {
    if (chunk.type !== 'tool-result') return;
    // Finalize current assistant message if exists
    if (this.state.currentAssistantMessage) {
      // Type assertion is safe here because TypedAssistantMessage is compatible with CoreMessage
      this.state.accumulatedMessages.push(this.state.currentAssistantMessage as CoreMessage);
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
      const status = determineToolStatus(chunk.result);

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
      this.state.accumulatedMessages.push(this.state.currentAssistantMessage as CoreMessage);
      this.state.currentAssistantMessage = null;
    }

    // Force save on step finish
    await this.saveToDatabase();
  }

  private async handleFinish() {
    // Finalize any current assistant message
    if (this.state.currentAssistantMessage) {
      this.state.accumulatedMessages.push(this.state.currentAssistantMessage as CoreMessage);
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
        // Type assertion is safe here because TypedAssistantMessage is compatible with CoreMessage
        allMessages.push(this.state.currentAssistantMessage as CoreMessage);
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
          .filter(
            (r): r is ResponseEntry & { id: string } =>
              r !== null && typeof r === 'object' && 'id' in r
          )
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

  // Tool status determination moved to types.ts as determineToolStatus function

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
      if (hasStatus(entry)) {
        entry.status = status;
      }

      // Update file statuses if this is a file-type entry
      if (hasFiles(entry)) {
        for (const fileId in entry.files) {
          const file = entry.files[fileId];
          if (file && typeof file === 'object') {
            (file as { status?: string }).status = status;
          }
        }
      }

      if (timing && hasSecondaryTitle(entry)) {
        const seconds = timing / 1000;
        if (seconds >= 60) {
          const minutes = Math.round(seconds / 60);
          entry.secondary_title = `${minutes}m`;
        } else {
          entry.secondary_title = `${seconds.toFixed(1)}s`;
        }
      }
    }
  }

  /**
   * Update reasoning entry with optimistically parsed values
   */
  private updateReasoningEntryWithOptimisticValues(
    entry: ReasoningEntry,
    toolName: string,
    parseResult: ReturnType<typeof OptimisticJsonParser.parse>
  ): void {
    if (!entry || typeof entry !== 'object') return;

    // Handle different tool types with optimistic updates
    switch (toolName) {
      case 'doneTool':
      case 'done-tool':
      case 'respondWithoutAnalysis':
      case 'respond-without-analysis': {
        // Update message with optimistically parsed final_response
        const finalResponse = getOptimisticValue<string>(
          parseResult.extractedValues,
          'final_response',
          ''
        );
        if (finalResponse && 'message' in entry) {
          (entry as ReasoningEntry & { message: string }).message = finalResponse;
        }
        break;
      }

      case 'sequentialThinking':
      case 'sequential-thinking': {
        // Update thought message as it streams
        const thought = getOptimisticValue<string>(parseResult.extractedValues, 'thought', '');
        if (thought && 'message' in entry) {
          (entry as ReasoningEntry & { message: string }).message = thought;
        }

        // Update finished_reasoning if available
        const nextThoughtNeeded = getOptimisticValue<boolean>(
          parseResult.extractedValues,
          'nextThoughtNeeded'
        );
        if (nextThoughtNeeded !== undefined && 'finished_reasoning' in entry) {
          (entry as ReasoningEntry & { finished_reasoning: boolean }).finished_reasoning =
            !nextThoughtNeeded;
        }
        break;
      }

      case 'submitThoughts': {
        // Update thoughts message as it streams
        const thoughts = getOptimisticValue<string>(parseResult.extractedValues, 'thoughts', '');
        if (thoughts && 'message' in entry) {
          (entry as ReasoningEntry & { message: string }).message = thoughts;
        }
        break;
      }

      case 'createMetrics':
      case 'create-metrics-file': {
        // For file-based tools, we might want to update file content
        // This is more complex and might need special handling
        break;
      }

      case 'executeSql':
      case 'execute-sql': {
        // Could update SQL content as it streams
        const sql = getOptimisticValue<string>(parseResult.extractedValues, 'sql', '');
        if (sql && hasFiles(entry)) {
          // Update the SQL file content
          const fileIds = (entry as ReasoningEntry & { file_ids: string[] }).file_ids;
          if (fileIds && fileIds.length > 0) {
            const fileId = fileIds[0];
            const file = entry.files[fileId];
            if (file && file.file) {
              file.file.text = sql;
            }
          }
        }
        break;
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
        if (isSequentialThinkingArgs(args)) {
          return {
            id: toolCallId,
            type: 'text',
            title: 'Thinking...',
            status: 'loading',
            message: args.thought,
            message_chunk: undefined,
            secondary_title: undefined,
            finished_reasoning: !args.nextThoughtNeeded,
          } as ReasoningEntry;
        }
        break;

      case 'createMetrics':
      case 'create-metrics-file':
        if (isCreateMetricsArgs(args)) {
          const files: Record<
            string,
            {
              id: string;
              file_type: string;
              file_name: string;
              version_number: number;
              status: string;
              file: {
                text?: string;
                modified?: [number, number][];
              };
            }
          > = {};
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
        if (isExecuteSqlArgs(args)) {
          let sqlContent = '';
          if (args.queries && Array.isArray(args.queries)) {
            sqlContent = args.queries.map(extractSqlFromQuery).join('\n\n');
          } else if (args.sql && typeof args.sql === 'string') {
            sqlContent = args.sql;
          }

          if (sqlContent) {
            const fileId = crypto.randomUUID();
            const files: Record<
              string,
              {
                id: string;
                file_type: string;
                file_name: string;
                version_number: number;
                status: string;
                file: {
                  text?: string;
                  modified?: [number, number][];
                };
              }
            > = {};

            files[fileId] = {
              id: fileId,
              file_type: 'agent-action',
              file_name: 'sql_query.sql',
              version_number: 1,
              status: 'loading',
              file: {
                text: sqlContent,
              },
            };

            return {
              id: toolCallId,
              type: 'files',
              title: 'Executing SQL',
              status: 'loading',
              secondary_title: undefined,
              file_ids: [fileId],
              files,
            } as ReasoningEntry;
          }
        }
        break;

      case 'submitThoughts':
        if (isSubmitThoughtsArgs(args)) {
          return {
            id: toolCallId,
            type: 'text',
            title: 'Submitting Analysis',
            status: 'loading',
            message: args.thoughts,
            message_chunk: undefined,
            secondary_title: undefined,
            finished_reasoning: false,
          } as ReasoningEntry;
        }
        break;

      default: {
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
          message_chunk: undefined,
          secondary_title: undefined,
          finished_reasoning: false,
        } as ReasoningEntry;
      }
    }

    return null;
  }

  /**
   * Check if a tool is a response tool (doneTool, respondWithoutAnalysis)
   */
  private isResponseTool(toolName: string): boolean {
    const responseTools = [
      'doneTool',
      'done-tool',
      'respondWithoutAnalysis',
      'respond-without-analysis',
    ];
    return responseTools.includes(toolName);
  }

  /**
   * Create a response entry for streaming response tools
   */
  private createResponseEntry(
    toolCallId: string,
    toolName: string,
    parseResult: ReturnType<typeof OptimisticJsonParser.parse>
  ): ResponseEntry | null {
    let message = '';

    switch (toolName) {
      case 'doneTool':
      case 'done-tool':
        message = getOptimisticValue<string>(parseResult.extractedValues, 'final_response', '');
        break;

      case 'respondWithoutAnalysis':
      case 'respond-without-analysis':
        message = getOptimisticValue<string>(parseResult.extractedValues, 'response', '');
        break;

      default:
        return null;
    }

    // Only create entry if we have some content
    if (!message) {
      return null;
    }

    return {
      id: toolCallId,
      type: 'text',
      message,
      is_final_message: true,
    } as ResponseEntry;
  }

  /**
   * Update response entry with optimistically parsed values
   */
  private updateResponseEntryWithOptimisticValues(
    entry: ResponseEntry,
    toolName: string,
    parseResult: ReturnType<typeof OptimisticJsonParser.parse>
  ): void {
    if (!entry || typeof entry !== 'object' || entry.type !== 'text') return;

    let message = '';

    switch (toolName) {
      case 'doneTool':
      case 'done-tool':
        message = getOptimisticValue<string>(parseResult.extractedValues, 'final_response', '');
        break;

      case 'respondWithoutAnalysis':
      case 'respond-without-analysis':
        message = getOptimisticValue<string>(parseResult.extractedValues, 'response', '');
        break;
    }

    if (message && 'message' in entry) {
      (entry as ResponseEntry & { message: string }).message = message;
    }
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
      // Type assertion is safe here because TypedAssistantMessage is compatible with CoreMessage
      messages.push(this.state.currentAssistantMessage as CoreMessage);
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

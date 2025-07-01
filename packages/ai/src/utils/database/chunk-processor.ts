import { updateMessageFields } from '@buster/database';
import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '@buster/server-shared/chats';
import type { CoreMessage, TextStreamPart, ToolSet } from 'ai';
import type { ExtractedFile } from '../file-selection';
import {
  createFileResponseMessages,
  extractFilesFromReasoning,
  selectFilesForResponse,
} from '../file-selection';
import { normalizeEscapedText } from '../streaming/escape-normalizer';
import { OptimisticJsonParser, getOptimisticValue } from '../streaming/optimistic-json-parser';
import { extractResponseMessages } from './format-llm-messages-as-reasoning';
import type {
  AssistantMessageContent,
  GenericToolSet,
  ToolCallInProgress,
  TypedAssistantMessage,
} from './types';
import {
  determineToolStatus,
  extractFileResultsFromToolResult,
  extractSqlFromQuery,
  hasFiles,
  hasSecondaryTitle,
  hasStatus,
  isCreateDashboardsArgs,
  isCreateMetricsArgs,
  isExecuteSqlArgs,
  isModifyDashboardsArgs,
  isModifyMetricsArgs,
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
    lastCompletionTime?: number; // Track when the last tool completed
    toolCallTimings: Map<string, number>; // toolCallId -> completion time
  };
}

export class ChunkProcessor<T extends ToolSet = GenericToolSet> {
  private state: ChunkProcessorState;
  private messageId: string | null;
  private lastSaveTime = 0;
  private readonly SAVE_THROTTLE_MS = 0; // Increased throttle for better batching
  private fileMessagesAdded = false; // Track if file messages have been added
  private pendingSave: Promise<void> | null = null; // Track ongoing save operations
  private saveQueue = Promise.resolve(); // Queue for non-blocking saves
  private queuedSaveCount = 0;
  private readonly MAX_QUEUED_SAVES = 3;
  private deferDoneToolResponse = false; // Whether to defer doneTool response handling
  private pendingDoneToolEntry: ResponseEntry | null = null; // Track pending doneTool entry
  private sqlExecutionStartTimes = new Map<string, number>(); // Track SQL execution start times
  private availableTools?: Set<string>; // Track which tools are available in current step

  // Reactive file selection state
  private currentFileSelection: {
    files: ExtractedFile[];
    version: number;
  } = { files: [], version: 0 };

  // Dashboard context from database
  private dashboardContext: Array<{
    id: string;
    name: string;
    versionNumber: number;
    metricIds: string[];
  }> = [];

  constructor(
    messageId: string | null,
    initialMessages: CoreMessage[] = [],
    initialReasoningHistory: ReasoningEntry[] = [],
    initialResponseHistory: ResponseEntry[] = [],
    dashboardContext?: Array<{
      id: string;
      name: string;
      versionNumber: number;
      metricIds: string[];
    }>,
    availableTools?: Set<string>
  ) {
    this.messageId = messageId;
    this.dashboardContext = dashboardContext || [];
    this.availableTools = availableTools || new Set();
    
    console.info('[ChunkProcessor] Constructor called:', {
      messageId,
      initialMessagesCount: initialMessages.length,
      initialReasoningCount: initialReasoningHistory.length,
      initialResponseCount: initialResponseHistory.length,
      dashboardContextProvided: dashboardContext !== undefined,
      dashboardContextLength: this.dashboardContext.length,
      availableToolsCount: availableTools?.size,
      availableTools: availableTools ? Array.from(availableTools) : undefined,
    });
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
   * Check if a tool is valid for the current step
   */
  private isValidTool(toolName: string): boolean {
    // If no tools specified, accept all (backward compatibility)
    if (!this.availableTools) return true;
    
    // Check if tool is in the available set
    return this.availableTools.has(toolName);
  }

  /**
   * Process a chunk and potentially save to database
   */
  async processChunk(chunk: TextStreamPart<T>): Promise<void> {
    try {
      switch (chunk.type) {
        case 'text-delta':
          this.handleTextDelta(chunk);
          break;

        case 'tool-call':
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
    } catch (error) {
      console.error('Error processing chunk:', {
        chunkType: chunk.type,
        messageId: this.messageId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Don't re-throw - continue processing stream
    }
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

    // Check if this tool call already exists (from streaming start)
    const existingToolCall = this.state.currentAssistantMessage.content.find(
      (part): part is typeof part & { toolCallId: string } =>
        isToolCallContent(part) && part.toolCallId === chunk.toolCallId
    );

    if (existingToolCall) {
      // Update existing tool call with complete args instead of adding a duplicate
      if (isToolCallContent(existingToolCall)) {
        existingToolCall.args = chunk.args || {};
      }
    } else {
      // Only add if it doesn't already exist
      const toolCall: AssistantMessageContent = {
        type: 'tool-call',
        toolCallId: chunk.toolCallId,
        toolName: chunk.toolName,
        args: chunk.args || {},
      };

      this.state.currentAssistantMessage.content.push(toolCall);
    }

    // Start timing on first tool call
    if (!this.state.timing.startTime) {
      this.state.timing.startTime = Date.now();
    }

    // Check if tool is valid for current step before processing into reasoning/response
    if (!this.isValidTool(chunk.toolName)) {
      console.warn(`[ChunkProcessor] Tool ${chunk.toolName} not available in current step - excluding from reasoning/response`);
      // Tool is still added to raw messages above, but we skip reasoning/response processing
      return;
    }

    // Check if this is a response tool
    if (this.isResponseTool(chunk.toolName)) {
      // Create response entry for this tool call
      // For complete tool calls, we need to extract all values including nested ones
      const extractedValues = new Map<string, unknown>();
      if (chunk.args && typeof chunk.args === 'object') {
        // Recursively extract all key-value pairs
        const extract = (obj: unknown, prefix = '') => {
          if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;

          const record = obj as Record<string, unknown>;
          for (const [key, value] of Object.entries(record)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            extractedValues.set(fullKey, value);
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              extract(value, fullKey);
            }
          }
        };
        extract(chunk.args);
      }

      const parseResult = {
        parsed: chunk.args || {},
        isComplete: true,
        extractedValues,
      };

      if (chunk.toolName === 'doneTool') {
        // Update file selection and insert files immediately
        this.updateFileSelection();
        this.insertCurrentFileSelection();

        // Create and add doneTool response
        const responseEntry = this.createResponseEntry(
          chunk.toolCallId,
          chunk.toolName,
          parseResult
        );
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
        const responseEntry = this.createResponseEntry(
          chunk.toolCallId,
          chunk.toolName,
          parseResult
        );

        if (responseEntry) {
          // Check if this response entry already exists (avoid duplicates)
          const existingEntry = this.state.responseHistory.find(
            (r) => r && typeof r === 'object' && 'id' in r && r.id === chunk.toolCallId
          );

          if (!existingEntry) {
            this.state.responseHistory.push(responseEntry);
          }
        }
      }
    } else {
      // Check if this reasoning entry already exists (from streaming)
      const existingEntryIndex = this.state.reasoningHistory.findIndex(
        (r) => r && typeof r === 'object' && 'id' in r && r.id === chunk.toolCallId
      );

      if (existingEntryIndex !== -1) {
        // We already have an entry from streaming - update status but preserve data
        const existingEntry = this.state.reasoningHistory[existingEntryIndex];
        if (existingEntry && existingEntry.type === 'files') {
          // For file entries, just update the status, keep all accumulated data
          this.state.reasoningHistory[existingEntryIndex] = {
            ...existingEntry,
            status: 'loading', // Keep as loading until tool-result
          };
        } else {
          // For non-file entries, create new entry with complete args
          const reasoningEntry = this.createReasoningEntry(
            chunk.toolCallId,
            chunk.toolName,
            chunk.args || {}
          );
          if (reasoningEntry) {
            this.state.reasoningHistory[existingEntryIndex] = reasoningEntry;
          }
        }
      } else {
        // No existing entry - create new one
        const reasoningEntry = this.createReasoningEntry(
          chunk.toolCallId,
          chunk.toolName,
          chunk.args || {}
        );
        if (reasoningEntry) {
          this.state.reasoningHistory.push(reasoningEntry);
        }
      }
    }

    // Check if this is a finishing tool
    if (['doneTool', 'respondWithoutAnalysis', 'submitThoughts'].includes(chunk.toolName)) {
      this.state.hasFinishingTool = true;
      this.state.finishedToolName = chunk.toolName;
    }

    // Track SQL execution start time
    if (['executeSql', 'execute-sql'].includes(chunk.toolName)) {
      this.sqlExecutionStartTimes.set(chunk.toolCallId, Date.now());
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

    // Check if tool is valid for current step before processing into reasoning/response
    if (!this.isValidTool(chunk.toolName)) {
      console.warn(`[ChunkProcessor] Tool ${chunk.toolName} not available in current step - excluding from reasoning/response`);
      // Tool is still added to raw messages above, but we skip reasoning/response processing
      return;
    }

    // Create initial entries for both response and reasoning tools
    if (this.isResponseTool(chunk.toolName)) {
      // Check if this is doneTool - immediately insert current file selection
      if (chunk.toolName === 'doneTool') {
        // Update file selection one more time to ensure we have the latest
        this.updateFileSelection();

        // Insert current file selection into response messages immediately
        this.insertCurrentFileSelection();

        // Create response entry for doneTool
        const parseResult = {
          parsed: {},
          isComplete: false,
          extractedValues: new Map(),
        };
        const responseEntry = this.createResponseEntry(
          chunk.toolCallId,
          chunk.toolName,
          parseResult
        );
        if (responseEntry) {
          this.state.responseHistory.push(responseEntry);
        }
      } else {
        // Create initial empty response entry that will be updated by deltas
        const parseResult = {
          parsed: {},
          isComplete: false,
          extractedValues: new Map(),
        };
        const responseEntry = this.createResponseEntry(
          chunk.toolCallId,
          chunk.toolName,
          parseResult
        );
        if (responseEntry) {
          this.state.responseHistory.push(responseEntry);
        }
      }
    } else {
      // For some tools, we create initial entries during streaming start
      // For others, we wait for complete args in the tool-call event
      const waitForCompleteArgs = ['executeSql', 'execute-sql'].includes(chunk.toolName);

      // File-based tools get special handling - create empty entry that will be populated
      const fileToolTitles: Record<string, string> = {
        createMetrics: 'Building new metrics...',
        'create-metrics-file': 'Building new metrics...',
        createDashboards: 'Building new dashboards...',
        'create-dashboards-file': 'Building new dashboards...',
        modifyMetrics: 'Modifying metrics...',
        'modify-metrics-file': 'Modifying metrics...',
        modifyDashboards: 'Modifying dashboards...',
        'modify-dashboards-file': 'Modifying dashboards...',
      };

      const fileToolTitle = fileToolTitles[chunk.toolName];
      if (fileToolTitle) {
        // Create initial empty files entry that will be populated as files stream in
        const entry: ReasoningEntry = {
          id: chunk.toolCallId,
          type: 'files',
          title: fileToolTitle,
          status: 'loading',
          secondary_title: undefined,
          file_ids: [],
          files: {},
        } as ReasoningEntry;
        this.state.reasoningHistory.push(entry);
      } else if (!waitForCompleteArgs) {
        // Create initial reasoning entry for tools that don't need complete args
        const reasoningEntry = this.createReasoningEntry(
          chunk.toolCallId,
          chunk.toolName,
          {} // Empty args initially
        );
        if (reasoningEntry) {
          this.state.reasoningHistory.push(reasoningEntry);
        }
      }
    }

    // Don't mark as finishing tool during streaming start - wait for complete tool call
    // This prevents the stream from being aborted before we receive all the content
  }

  private handleToolCallDelta(chunk: TextStreamPart<T>) {
    if (chunk.type !== 'tool-call-delta') return;
    const inProgress = this.state.toolCallsInProgress.get(chunk.toolCallId);
    if (!inProgress) return;

    try {
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

      // Check if tool is valid for current step before processing into reasoning/response
      if (!this.isValidTool(inProgress.toolName)) {
        // Tool deltas are still accumulated in the raw message, but we skip reasoning/response processing
        return;
      }

      // Check if this is a response tool
      const isResponseTool = this.isResponseTool(inProgress.toolName);

      if (isResponseTool) {
        // Handle response tools (doneTool, respondWithoutAnalysis)
        if (inProgress.toolName === 'doneTool' && this.deferDoneToolResponse) {
          // Find the response entry in the response history
          const existingResponse = this.state.responseHistory.find(
            (r) => r && typeof r === 'object' && 'id' in r && r.id === chunk.toolCallId
          );

          if (existingResponse) {
            // Update the entry in response history (for streaming)
            this.updateResponseEntryWithOptimisticValues(
              existingResponse,
              inProgress.toolName,
              parseResult
            );
            // Also update the pending entry reference
            this.pendingDoneToolEntry = existingResponse;
          } else {
            // Shouldn't happen, but handle gracefully
            const responseEntry = this.createResponseEntry(
              chunk.toolCallId,
              inProgress.toolName,
              parseResult
            );
            if (responseEntry) {
              this.state.responseHistory.push(responseEntry);
              this.pendingDoneToolEntry = responseEntry;
            }
          }
        } else {
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
    } catch (error) {
      console.error('Error handling tool call delta:', {
        toolCallId: chunk.toolCallId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Continue processing - don't fail the entire stream
    }
  }

  private async handleToolResult(chunk: TextStreamPart<T>) {
    if (chunk.type !== 'tool-result') return;

    try {
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

      // Check if tool is valid for current step before processing reasoning/response
      if (!this.isValidTool(chunk.toolName)) {
        console.warn(`[ChunkProcessor] Tool result for ${chunk.toolName} added to messages but excluded from reasoning/response`);
        // Clear the tool from tracking but don't process reasoning/response
        this.state.toolCallsInProgress.delete(chunk.toolCallId);
        return;
      }

      // Track tool completion timing and update reasoning entry
      if (this.state.timing.startTime) {
        const completedAt = Date.now();
        // Calculate incremental time since last tool completion (or start time for first tool)
        const lastTime = this.state.timing.lastCompletionTime || this.state.timing.startTime;
        const incrementalTime = completedAt - lastTime;

        // Update timing state
        this.state.timing.lastCompletionTime = completedAt;
        this.state.timing.toolCallTimings.set(chunk.toolCallId, incrementalTime);

        // Determine if the tool succeeded or failed based on the result
        const status = determineToolStatus(chunk.result);

        // Special handling for SQL tools - append results to file content
        if (chunk.toolName === 'executeSql' || chunk.toolName === 'execute-sql') {
          this.updateSqlFileWithResults(chunk.toolCallId, chunk.result);
        }

        // Special handling for file creation/modification tools - update dummy IDs with actual IDs
        if (this.isFileCreationTool(chunk.toolName)) {
          this.updateFileIdsAndStatusFromToolResult(chunk.toolCallId, chunk.result);
        }

        // Update the specific reasoning entry for this tool call
        this.updateReasoningEntryStatus(chunk.toolCallId, status, incrementalTime, chunk.toolName);
      }

      // Clear the tool call from tracking
      this.state.toolCallsInProgress.delete(chunk.toolCallId);

      // Use non-blocking save for tool results to avoid blocking stream
      this.saveToDatabaseNonBlocking();
    } catch (error) {
      console.error('Error handling tool result:', {
        toolCallId: chunk.toolCallId,
        toolName: chunk.toolName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Continue processing
    }
  }

  private async handleStepFinish() {
    // Finalize any current assistant message
    if (this.state.currentAssistantMessage) {
      this.state.accumulatedMessages.push(this.state.currentAssistantMessage as CoreMessage);
      this.state.currentAssistantMessage = null;
    }

    // Use non-blocking save for step finish to avoid blocking stream
    this.saveToDatabaseNonBlocking();
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

  /**
   * Non-blocking save for intermediate updates during streaming
   * Returns immediately but queues the save operation
   */
  private saveToDatabaseNonBlocking(): void {
    if (!this.messageId) {
      return;
    }

    // Prevent queue from growing too large
    if (this.queuedSaveCount >= this.MAX_QUEUED_SAVES) {
      return; // Skip this save, next one will catch up
    }

    this.queuedSaveCount++;

    // Chain saves but don't block the current operation
    this.saveQueue = this.saveQueue
      .then(() => this.performDatabaseSave())
      .catch((error) => {
        console.error('Background save failed:', error);
      })
      .finally(() => {
        this.queuedSaveCount--;
      });
  }

  /**
   * Blocking save for critical operations (end of stream, file processing)
   * Waits for any pending saves to complete first
   */
  async saveToDatabase() {
    if (!this.messageId) {
      return;
    }

    // Wait for queued saves to complete
    await this.saveQueue;

    // Then do final save
    await this.performDatabaseSave();
  }

  /**
   * Core database save logic - simplified to use full overwrites
   * This is more reliable than partial updates for our use case
   */
  private async performDatabaseSave(): Promise<void> {
    if (!this.messageId) {
      return;
    }

    // Build messages including current assistant message if in progress
    const allMessages = [...this.state.accumulatedMessages];
    if (this.state.currentAssistantMessage) {
      // Type assertion is safe here because TypedAssistantMessage is compatible with CoreMessage
      allMessages.push(this.state.currentAssistantMessage as CoreMessage);
    }

    try {
      // Don't save if we have no messages
      if (allMessages.length === 0) {
        return;
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

      // Update the last processed index
      this.state.lastProcessedMessageIndex = this.state.currentAssistantMessage
        ? allMessages.length - 2 // Exclude the current in-progress message
        : allMessages.length - 1;
    } catch (error) {
      console.error('Error saving to database:', {
        messageId: this.messageId,
        messageCount: allMessages.length,
        reasoningCount: this.state.reasoningHistory.length,
        responseCount: this.state.responseHistory.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
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
    timing?: number,
    toolName?: string
  ): void {
    const entry = this.state.reasoningHistory.find(
      (r) => r && typeof r === 'object' && 'id' in r && r.id === toolCallId
    );

    if (entry && typeof entry === 'object') {
      // Type-safe update of status
      if (hasStatus(entry)) {
        entry.status = status;
      }

      // Update title based on completion status
      if ('title' in entry && toolName && (status === 'completed' || status === 'failed')) {
        const typedEntry = entry as ReasoningEntry & { title: string };

        switch (toolName) {
          case 'sequentialThinking':
          case 'sequential-thinking':
            typedEntry.title = 'Thought for a few seconds';
            break;

          case 'createTodoList':
          case 'create_todo_item':
            typedEntry.title = 'Broke down your request';
            break;

          case 'executeSql':
          case 'execute-sql':
            // Count the number of queries
            if (entry.type === 'files' && entry.files) {
              const fileIds = (entry as ReasoningEntry & { file_ids: string[] }).file_ids || [];
              if (fileIds.length > 0) {
                const fileId = fileIds[0];
                if (fileId) {
                  const file = entry.files[fileId];
                  if (file && typeof file === 'object' && 'file' in file) {
                    const fileObj = file as { file?: { text?: string } };
                    const text = fileObj.file?.text || '';
                    // Count lines that start with "  - " (YAML list items)
                    const queryCount = (text.match(/^ {2}- /gm) || []).length;
                    if (queryCount > 0) {
                      typedEntry.title = `Generated ${queryCount} validation ${queryCount === 1 ? 'query' : 'queries'}`;
                    }
                  }
                }
              }
            }
            break;

          case 'createMetrics':
          case 'create-metrics-file':
          case 'createDashboards':
          case 'create-dashboards-file':
          case 'modifyMetrics':
          case 'modify-metrics-file':
          case 'modifyDashboards':
          case 'modify-dashboards-file':
            // These are handled in updateFileIdsAndStatusFromToolResult
            // which has access to the actual success/failure counts
            break;
        }
      }

      // For file creation tools, DON'T update individual file statuses here
      // The updateFileIdsAndStatusFromToolResult method will handle per-file statuses
      // based on the actual tool result (which files succeeded vs failed)

      // Only update file statuses for non-file-creation tools (like executeSql)
      if (hasFiles(entry) && toolName && !this.isFileCreationTool(toolName)) {
        for (const fileId in entry.files) {
          const file = entry.files[fileId];
          if (file && typeof file === 'object') {
            // Ensure file status property exists and is updated
            const fileObj = file as { status?: string; [key: string]: unknown };
            fileObj.status = status;
          }
        }
      }

      if (timing && hasSecondaryTitle(entry)) {
        const seconds = timing / 1000;
        if (seconds >= 60) {
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = Math.round(seconds % 60);
          entry.secondary_title = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`;
        } else {
          entry.secondary_title = `${seconds.toFixed(1)} seconds`;
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
          // Normalize any double-escaped characters
          (entry as ReasoningEntry & { message: string }).message = normalizeEscapedText(thought);
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
          // Normalize any double-escaped characters
          (entry as ReasoningEntry & { message: string }).message = normalizeEscapedText(thoughts);
        }
        break;
      }

      case 'createMetrics':
      case 'create-metrics-file': {
        // Parse streaming files array to show incremental progress
        const filesArray = getOptimisticValue<unknown[]>(parseResult.extractedValues, 'files', []);
        if (filesArray && Array.isArray(filesArray) && entry.type === 'files') {
          const existingFiles = entry.files || {};
          const existingFileIds = (entry as ReasoningEntry & { file_ids: string[] }).file_ids || [];

          // Process each file in the array (might be incrementally added)
          filesArray.forEach((file, index) => {
            if (file && typeof file === 'object') {
              const hasName = 'name' in file && file.name;
              const hasContent = 'yml_content' in file && file.yml_content;

              // Only add file when both name AND yml_content are present
              const fileIdAtIndex = existingFileIds[index];
              if (hasName && hasContent && !fileIdAtIndex) {
                const fileId = crypto.randomUUID();
                existingFileIds[index] = fileId;
                existingFiles[fileId] = {
                  id: fileId,
                  file_type: 'metric',
                  file_name: (file as { name?: string }).name || '',
                  version_number: undefined, // Temporary value - will be updated from tool result
                  status: 'loading',
                  file: {
                    text: (file as { yml_content?: string }).yml_content || '',
                  },
                };
              } else if (fileIdAtIndex && hasContent) {
                // Update existing file content if it has changed
                const fileId = fileIdAtIndex;
                const existingFile = existingFiles[fileId];
                if (existingFile?.file) {
                  existingFile.file.text = (file as { yml_content?: string }).yml_content || '';
                }
              }
            }
          });

          // Update the entry - keep sparse array to maintain index mapping
          (entry as ReasoningEntry & { file_ids: string[] }).file_ids = existingFileIds;
          entry.files = existingFiles;

          // Title stays static - "Creating metrics..."
        }
        break;
      }

      case 'createDashboards':
      case 'create-dashboards-file': {
        // Parse streaming files array to show incremental progress
        const filesArray = getOptimisticValue<unknown[]>(parseResult.extractedValues, 'files', []);
        if (filesArray && Array.isArray(filesArray) && entry.type === 'files') {
          const existingFiles = entry.files || {};
          const existingFileIds = (entry as ReasoningEntry & { file_ids: string[] }).file_ids || [];

          // Process each file in the array (might be incrementally added)
          filesArray.forEach((file, index) => {
            if (file && typeof file === 'object') {
              const hasName = 'name' in file && file.name;
              const hasContent = 'yml_content' in file && file.yml_content;

              // Only add file when both name AND yml_content are present
              const fileIdAtIndex = existingFileIds[index];
              if (hasName && hasContent && !fileIdAtIndex) {
                const fileId = crypto.randomUUID();
                existingFileIds[index] = fileId;
                existingFiles[fileId] = {
                  id: fileId,
                  file_type: 'dashboard',
                  file_name: (file as { name?: string }).name || '',
                  version_number: undefined, // Temporary value - will be updated from tool result
                  status: 'loading',
                  file: {
                    text: (file as { yml_content?: string }).yml_content || '',
                  },
                };
              } else if (fileIdAtIndex && hasContent) {
                // Update existing file content if it has changed
                const fileId = fileIdAtIndex;
                const existingFile = existingFiles[fileId];
                if (existingFile?.file) {
                  existingFile.file.text = (file as { yml_content?: string }).yml_content || '';
                }
              }
            }
          });

          // Update the entry - keep sparse array to maintain index mapping
          (entry as ReasoningEntry & { file_ids: string[] }).file_ids = existingFileIds;
          entry.files = existingFiles;

          // Title stays static - "Creating dashboards..."
        }
        break;
      }

      case 'executeSql':
      case 'execute-sql': {
        // Update SQL content as it streams
        const rawStatements = getOptimisticValue<unknown>(
          parseResult.extractedValues,
          'statements',
          []
        );

        // Ensure statements is an array
        let statements: string[] = [];
        if (Array.isArray(rawStatements)) {
          statements = rawStatements.filter((s): s is string => typeof s === 'string');
        } else if (typeof rawStatements === 'string') {
          // Handle case where statements might be a JSON string
          try {
            const parsed = JSON.parse(rawStatements);
            if (Array.isArray(parsed)) {
              statements = parsed.filter((s): s is string => typeof s === 'string');
            }
          } catch {
            // If parsing fails, treat as single statement
            statements = [rawStatements];
          }
        }

        const sql = getOptimisticValue<string>(parseResult.extractedValues, 'sql', '');

        if (entry.type === 'files') {
          const fileIds = (entry as ReasoningEntry & { file_ids: string[] }).file_ids;
          if (fileIds && fileIds.length > 0) {
            const fileId = fileIds[0];
            if (fileId) {
              const file = entry.files[fileId];
              if (file?.file) {
                // Update with statements (preferred) or fallback to sql
                if (statements && statements.length > 0) {
                  const statementsYaml = `statements:\n${statements.map((stmt) => `  - ${stmt}`).join('\n')}`;
                  file.file.text = statementsYaml;
                } else if (sql) {
                  file.file.text = sql;
                }
              }
            }
          }
        }
        break;
      }

      case 'modifyMetrics':
      case 'modify-metrics-file': {
        // Parse streaming files array to show progress
        const filesArray = getOptimisticValue<unknown[]>(parseResult.extractedValues, 'files', []);
        if (filesArray && Array.isArray(filesArray) && entry.type === 'files') {
          const existingFiles = entry.files || {};
          const existingFileIds = (entry as ReasoningEntry & { file_ids: string[] }).file_ids || [];

          // Process each file in the array
          filesArray.forEach((file, index) => {
            if (file && typeof file === 'object') {
              const hasId = 'id' in file && file.id;
              const hasName = 'name' in file && file.name;
              const hasContent = 'yml_content' in file && file.yml_content;

              // Only add file when name is present (id is always present)
              const fileIdAtIndex = existingFileIds[index];
              if (hasId && hasName && !fileIdAtIndex) {
                const fileId = (file as { id?: string }).id || ''; // Use the actual file ID
                existingFileIds[index] = fileId;
                existingFiles[fileId] = {
                  id: fileId,
                  file_type: 'metric',
                  file_name: (file as { name?: string }).name || '',
                  version_number: undefined, // Temporary value - will be updated from tool result
                  status: 'loading',
                  file: {
                    text: hasContent ? (file as { yml_content?: string }).yml_content || '' : '',
                  },
                };
              } else if (fileIdAtIndex) {
                // Update existing file with new data as it streams in
                const fileId = fileIdAtIndex;
                const existingFile = existingFiles[fileId];
                if (existingFile) {
                  // Update name if it has changed (handles partial name streaming)
                  if (hasName) {
                    const newName = (file as { name?: string }).name || '';
                    if (newName && newName !== existingFile.file_name) {
                      existingFile.file_name = newName;
                    }
                  }
                  // Update content if it has changed
                  if (hasContent && existingFile.file) {
                    existingFile.file.text = (file as { yml_content?: string }).yml_content || '';
                  }
                }
              }
            }
          });

          // Update the entry
          (entry as ReasoningEntry & { file_ids: string[] }).file_ids = existingFileIds;
          entry.files = existingFiles;

          // Title stays static - "Modifying metrics..."
        }
        break;
      }

      case 'modifyDashboards':
      case 'modify-dashboards-file': {
        // Parse streaming files array to show progress
        const filesArray = getOptimisticValue<unknown[]>(parseResult.extractedValues, 'files', []);
        if (filesArray && Array.isArray(filesArray) && entry.type === 'files') {
          const existingFiles = entry.files || {};
          const existingFileIds = (entry as ReasoningEntry & { file_ids: string[] }).file_ids || [];

          // Process each file in the array
          filesArray.forEach((file, index) => {
            if (file && typeof file === 'object') {
              const hasId = 'id' in file && file.id;
              const hasName = 'name' in file && file.name;
              const hasContent = 'yml_content' in file && file.yml_content;

              // Only add file when name is present (id is always present)
              const fileIdAtIndex = existingFileIds[index];
              if (hasId && hasName && !fileIdAtIndex) {
                const fileId = (file as { id?: string }).id || ''; // Use the actual file ID
                existingFileIds[index] = fileId;
                existingFiles[fileId] = {
                  id: fileId,
                  file_type: 'dashboard',
                  file_name: (file as { name?: string }).name || '',
                  version_number: undefined, // Temporary value - will be updated from tool result
                  status: 'loading',
                  file: {
                    text: hasContent ? (file as { yml_content?: string }).yml_content || '' : '',
                  },
                };
              } else if (fileIdAtIndex) {
                // Update existing file with new data as it streams in
                const fileId = fileIdAtIndex;
                const existingFile = existingFiles[fileId];
                if (existingFile) {
                  // Update name if it has changed (handles partial name streaming)
                  if (hasName) {
                    const newName = (file as { name?: string }).name || '';
                    if (newName && newName !== existingFile.file_name) {
                      existingFile.file_name = newName;
                    }
                  }
                  // Update content if it has changed
                  if (hasContent && existingFile.file) {
                    existingFile.file.text = (file as { yml_content?: string }).yml_content || '';
                  }
                }
              }
            }
          });

          // Update the entry
          (entry as ReasoningEntry & { file_ids: string[] }).file_ids = existingFileIds;
          entry.files = existingFiles;

          // Title stays static - "Modifying dashboards..."
        }
        break;
      }

      case 'createTodoList':
      case 'create_todo_item': {
        // Update todos as they stream
        const todos = getOptimisticValue<string>(parseResult.extractedValues, 'todos', '');
        if (todos && entry.type === 'files') {
          const fileIds = (entry as ReasoningEntry & { file_ids: string[] }).file_ids;
          if (fileIds && fileIds.length > 0) {
            const fileId = fileIds[0];
            if (fileId && entry.files[fileId]?.file) {
              // Update the text content with the streaming todos
              entry.files[fileId].file.text = todos;
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
            title: 'Thinking it through...',
            status: 'loading',
            message: normalizeEscapedText(args.thought),
            message_chunk: undefined,
            secondary_title: undefined,
            finished_reasoning: !args.nextThoughtNeeded,
          } as ReasoningEntry;
        }
        break;

      case 'createMetrics':
      case 'create-metrics-file':
        if (isCreateMetricsArgs(args)) {
          // Start with empty files - they'll be populated during streaming
          return {
            id: toolCallId,
            type: 'files',
            title: 'Building new metrics...',
            status: 'loading',
            secondary_title: undefined,
            file_ids: [],
            files: {},
          } as ReasoningEntry;
        }
        break;

      case 'executeSql':
      case 'execute-sql':
        if (isExecuteSqlArgs(args)) {
          // Extract SQL statements and format as YAML-like structure
          let statements: string[] = [];
          if (args.statements) {
            if (Array.isArray(args.statements)) {
              statements = args.statements;
            } else if (typeof args.statements === 'string') {
              // Handle case where statements is a JSON string
              try {
                const parsed = JSON.parse(args.statements);
                if (Array.isArray(parsed)) {
                  statements = parsed;
                } else {
                  statements = [args.statements];
                }
              } catch {
                statements = [args.statements];
              }
            }
          } else if (args.queries && Array.isArray(args.queries)) {
            statements = args.queries.map(extractSqlFromQuery);
          } else if (args.sql && typeof args.sql === 'string') {
            statements = [args.sql];
          }

          if (statements.length > 0) {
            // Format as statements-only YAML initially
            const statementsYaml = `statements:\n${statements.map((stmt) => `  - ${stmt}`).join('\n')}`;

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
              file_name: 'Validation Queries',
              version_number: 1,
              status: 'loading',
              file: {
                text: statementsYaml,
              },
            };

            return {
              id: toolCallId,
              type: 'files',
              title: 'Generating validation queries...',
              status: 'loading',
              secondary_title: undefined,
              file_ids: [fileId],
              files,
            } as ReasoningEntry;
          }
        }
        break;

      case 'createDashboards':
      case 'create-dashboards-file':
        // Handle similar to createMetrics - expects files array with name and yml_content
        if (isCreateDashboardsArgs(args)) {
          // Start with empty files - they'll be populated during streaming
          return {
            id: toolCallId,
            type: 'files',
            title: 'Building new dashboards...',
            status: 'loading',
            secondary_title: undefined,
            file_ids: [],
            files: {},
          } as ReasoningEntry;
        }
        break;

      case 'modifyMetrics':
      case 'modify-metrics-file':
        // Handle modify metrics - expects files array with id, name, and yml_content
        if (isModifyMetricsArgs(args)) {
          // Start with empty files - they'll be populated during streaming
          return {
            id: toolCallId,
            type: 'files',
            title: 'Modifying metrics...',
            status: 'loading',
            secondary_title: undefined,
            file_ids: [],
            files: {},
          } as ReasoningEntry;
        }
        break;

      case 'modifyDashboards':
      case 'modify-dashboards-file':
        // Handle modify dashboards - expects files array with id, name, and yml_content
        if (isModifyDashboardsArgs(args)) {
          // Start with empty files - they'll be populated during streaming
          return {
            id: toolCallId,
            type: 'files',
            title: 'Modifying dashboards...',
            status: 'loading',
            secondary_title: undefined,
            file_ids: [],
            files: {},
          } as ReasoningEntry;
        }
        break;

      case 'submitThoughts':
        if (isSubmitThoughtsArgs(args)) {
          return {
            id: toolCallId,
            type: 'text',
            title: 'Submitting Analysis',
            status: 'loading',
            message: normalizeEscapedText(args.thoughts),
            message_chunk: undefined,
            secondary_title: undefined,
            finished_reasoning: false,
          } as ReasoningEntry;
        }
        break;

      case 'createTodoList':
      case 'create_todo_item': {
        // Create a file entry for todos to enable streaming
        const fileId = `todo-${Date.now()}-${Math.random().toString(36).substr(2, 11)}`;
        return {
          id: toolCallId,
          type: 'files',
          title: 'Breaking down your request...',
          status: 'loading',
          secondary_title: undefined,
          file_ids: [fileId],
          files: {
            [fileId]: {
              id: fileId,
              file_type: 'agent-action',
              file_name: 'TODO list',
              version_number: 1,
              status: 'loading',
              file: {
                text: '', // Will be populated during streaming
              },
            },
          },
        } as ReasoningEntry;
      }

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
    try {
      let message = '';

      switch (toolName) {
        case 'doneTool':
        case 'done-tool':
          message =
            getOptimisticValue<string>(parseResult.extractedValues, 'final_response', '') || '';
          break;

        case 'respondWithoutAnalysis':
        case 'respond-without-analysis':
          message =
            getOptimisticValue<string>(parseResult.extractedValues, 'final_response', '') || '';
          break;

        default:
          return null;
      }

      // Always create entry, even if message is empty initially (will be updated by deltas)
      return {
        id: toolCallId,
        type: 'text',
        message: message || '', // Always provide a string, even if empty
        is_final_message: true,
      } as ResponseEntry;
    } catch (error) {
      console.error('Error creating response entry:', {
        toolCallId,
        toolName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
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
        message =
          getOptimisticValue<string>(parseResult.extractedValues, 'final_response', '') || '';
        break;

      case 'respondWithoutAnalysis':
      case 'respond-without-analysis':
        message =
          getOptimisticValue<string>(parseResult.extractedValues, 'final_response', '') || '';
        break;
    }

    // Always update the message, even if it's empty (during streaming it starts empty)
    if ('message' in entry) {
      (entry as ResponseEntry & { message: string }).message = message;
    }
  }

  /**
   * Set initial accumulated messages
   */
  setInitialMessages(messages: CoreMessage[]): void {
    this.state.accumulatedMessages = [...messages];
    // Update the index to mark these messages as already processed
    // This prevents duplicate processing when messages are passed between steps
    this.state.lastProcessedMessageIndex = messages.length - 1;
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
   * Get the last processed message index
   */
  getLastProcessedIndex(): number {
    return this.state.lastProcessedMessageIndex;
  }

  /**
   * Update SQL file content with results from tool execution
   */
  private updateSqlFileWithResults(toolCallId: string, toolResult: unknown): void {
    try {
      // Find the reasoning entry for this tool call
      const entry = this.state.reasoningHistory.find(
        (r) => r && typeof r === 'object' && 'id' in r && r.id === toolCallId
      );

      if (!entry || entry.type !== 'files') {
        return;
      }

      // Get the file content
      const fileIds = (entry as ReasoningEntry & { file_ids: string[] }).file_ids;
      if (!fileIds || fileIds.length === 0) {
        return;
      }

      const fileId = fileIds[0];
      if (!fileId) {
        return;
      }

      const file = entry.files[fileId];
      if (!file || typeof file !== 'object') {
        return;
      }

      // Parse the tool result to extract query results
      let results: Array<{
        status: 'success' | 'error';
        sql: string;
        results?: Record<string, unknown>[];
        error_message?: string;
      }> = [];

      try {
        if (toolResult && typeof toolResult === 'object' && 'results' in toolResult) {
          const toolResults = (toolResult as { results: unknown }).results;
          if (Array.isArray(toolResults)) {
            results = toolResults.map((result: unknown) => {
              const resultObj = result as Record<string, unknown>;
              const mappedResult: {
                status: 'error' | 'success';
                sql: string;
                results?: Record<string, unknown>[];
                error_message?: string;
              } = {
                status: resultObj.status === 'error' ? 'error' : ('success' as const),
                sql: typeof resultObj.sql === 'string' ? resultObj.sql : '',
              };

              if (resultObj.status === 'success' && Array.isArray(resultObj.results)) {
                mappedResult.results = resultObj.results as Record<string, unknown>[];
              }

              if (resultObj.status === 'error' && typeof resultObj.error_message === 'string') {
                mappedResult.error_message = resultObj.error_message;
              }

              return mappedResult;
            });
          }
        }
      } catch (error) {
        console.error('Error parsing SQL tool result:', error);
        return;
      }

      // Create results as YAML
      let resultsYaml = 'results:';

      for (const result of results) {
        resultsYaml += `\n  - status: ${result.status}`;
        resultsYaml += `\n    sql: ${result.sql}`;

        if (result.status === 'error' && result.error_message) {
          resultsYaml += `\n    error_message: |-\n      ${result.error_message}`;
        } else if (result.status === 'success' && result.results) {
          resultsYaml += '\n    results:';
          for (const row of result.results) {
            resultsYaml += '\n      -';
            for (const [key, value] of Object.entries(row)) {
              resultsYaml += `\n        ${key}: ${value}`;
            }
          }
        }
      }

      // Count successful and failed queries
      const successCount = results.filter((r) => r.status === 'success').length;
      const failedCount = results.filter((r) => r.status === 'error').length;
      // Build the title with success/failure counts
      let title = '';
      if (failedCount > 0) {
        title = `Ran ${successCount} validation ${successCount === 1 ? 'query' : 'queries'}, ${failedCount} failed`;
      } else {
        title = `Ran ${results.length} validation ${results.length === 1 ? 'query' : 'queries'}`;
      }

      // Calculate execution time
      let secondaryTitle: string | undefined;
      const startTime = this.sqlExecutionStartTimes.get(toolCallId);
      if (startTime) {
        const executionTime = Date.now() - startTime;
        const seconds = executionTime / 1000;
        if (seconds >= 60) {
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = Math.round(seconds % 60);
          secondaryTitle = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`;
        } else {
          secondaryTitle = `${seconds.toFixed(1)} seconds`;
        }
        // Clean up the start time
        this.sqlExecutionStartTimes.delete(toolCallId);
      }

      // Create a new reasoning entry for the results
      const resultsFileId = crypto.randomUUID();
      const resultsEntry: ReasoningEntry = {
        id: `${toolCallId}-results`,
        type: 'files',
        title,
        status: 'completed',
        secondary_title: secondaryTitle,
        file_ids: [resultsFileId],
        files: {
          [resultsFileId]: {
            id: resultsFileId,
            file_type: 'agent-action',
            file_name: 'Query Results',
            version_number: 1,
            status: 'completed',
            file: {
              text: resultsYaml,
            },
          },
        },
      } as ReasoningEntry;

      // Add the new reasoning entry for results
      this.state.reasoningHistory.push(resultsEntry);
    } catch (error) {
      console.error('Error updating SQL file with results:', {
        toolCallId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - continue processing
    }
  }

  /**
   * Check if a tool is a file creation/modification tool
   */
  private isFileCreationTool(toolName: string): boolean {
    const fileCreationTools = [
      'createMetrics',
      'create-metrics-file',
      'createDashboards',
      'create-dashboards-file',
      'modifyMetrics',
      'modify-metrics-file',
      'modifyDashboards',
      'modify-dashboards-file',
    ];
    return fileCreationTools.includes(toolName);
  }

  /**
   * Update file IDs and individual file statuses in reasoning entries from tool result
   * This method handles both successful file creation and partial failures
   */
  private updateFileIdsAndStatusFromToolResult(toolCallId: string, toolResult: unknown): void {
    try {
      // Find the reasoning entry for this tool call
      const entry = this.state.reasoningHistory.find(
        (r) => r && typeof r === 'object' && 'id' in r && r.id === toolCallId
      );

      if (!entry || entry.type !== 'files') {
        return;
      }

      // Extract file results with individual statuses
      const fileResults = extractFileResultsFromToolResult(toolResult);
      if (fileResults.length === 0) {
        return;
      }

      // Update the reasoning entry with actual file IDs and statuses
      const typedEntry = entry as ReasoningEntry & {
        file_ids: string[];
        files: Record<string, unknown>;
      };

      const dummyIds = typedEntry.file_ids || [];

      // Extract successful files and failed files from the result
      const successfulFiles: Array<{ id: string; name: string; version?: number }> = [];
      const failedFilesByName = new Map<string, string>(); // name -> error

      if (toolResult && typeof toolResult === 'object') {
        // Extract successful files
        if ('files' in toolResult && Array.isArray(toolResult.files)) {
          const files = toolResult.files as unknown[];
          for (const file of files) {
            if (file && typeof file === 'object' && 'id' in file && 'name' in file) {
              const fileObj = file as {
                id: unknown;
                name: unknown;
                version?: unknown;
                version_number?: unknown;
              };
              if (typeof fileObj.id === 'string' && typeof fileObj.name === 'string') {
                const fileInfo: { id: string; name: string; version?: number } = {
                  id: fileObj.id,
                  name: fileObj.name,
                };
                // Extract version if present - check both 'version' and 'version_number' fields
                if (typeof fileObj.version === 'number') {
                  fileInfo.version = fileObj.version;
                } else if (typeof fileObj.version_number === 'number') {
                  fileInfo.version = fileObj.version_number;
                }
                successfulFiles.push(fileInfo);
              }
            }
          }
        }

        // Extract failed files
        if ('failed_files' in toolResult && Array.isArray(toolResult.failed_files)) {
          const failedFiles = toolResult.failed_files as unknown[];
          for (const failedFile of failedFiles) {
            if (failedFile && typeof failedFile === 'object' && 'name' in failedFile) {
              const failed = failedFile as { name: unknown; error?: unknown };
              if (typeof failed.name === 'string') {
                const error = typeof failed.error === 'string' ? failed.error : 'Unknown error';
                failedFilesByName.set(failed.name, error);
              }
            }
          }
        }
      }

      // Map dummy IDs to actual IDs or mark as failed
      const updatedFiles: Record<string, unknown> = {};
      const updatedFileIds: string[] = [];

      // Process each file ID (could be dummy ID for create operations or actual ID for modify operations)
      for (const fileId of dummyIds) {
        if (!fileId) continue;

        const fileData = typedEntry.files[fileId];
        if (!fileData || typeof fileData !== 'object') continue;

        const typedFileData = fileData as {
          id?: string;
          status?: string;
          error?: string;
          file_name?: string;
          version_number?: number | undefined;
          [key: string]: unknown;
        };

        const fileName = typedFileData.file_name;

        if (!fileName) {
          // If no file name, keep the ID and mark as unknown
          updatedFiles[fileId] = fileData;
          updatedFileIds.push(fileId);
          continue;
        }

        // For modify operations, also check by ID (since they use actual file IDs)
        const successfulFile = successfulFiles.find((f) => f.name === fileName || f.id === fileId);

        if (successfulFile) {
          // Update with actual ID and mark as completed
          typedFileData.id = successfulFile.id;
          typedFileData.status = 'completed';

          // Set version number from tool result or default to 1 for create operations
          const toolName = this.state.toolCallsInProgress.get(toolCallId)?.toolName;
          if (successfulFile.version !== undefined) {
            typedFileData.version_number = successfulFile.version;
          } else if (
            toolName &&
            [
              'createMetrics',
              'create-metrics-file',
              'createDashboards',
              'create-dashboards-file',
            ].includes(toolName)
          ) {
            // For create operations, default to version 1 on success
            typedFileData.version_number = 1;
          } else if (
            toolName &&
            [
              'modifyMetrics',
              'modify-metrics-file',
              'modifyDashboards',
              'modify-dashboards-file',
            ].includes(toolName)
          ) {
            // For modify operations, if no version in result but file was successful,
            // ensure we have a version number (should never be undefined for completed files)
            if (typedFileData.version_number === undefined) {
              // Default to 1 if no version information is available
              // In practice, the backend should always provide version for modify operations
              typedFileData.version_number = 1;
              console.warn(
                `No version number provided for successful modify operation on file: ${fileName}`,
                { toolName, fileId: successfulFile.id }
              );
            }
          }

          updatedFiles[successfulFile.id] = fileData;
          updatedFileIds.push(successfulFile.id);
        } else if (failedFilesByName.has(fileName)) {
          // This file failed, keep the ID and mark as failed
          typedFileData.id = fileId;
          typedFileData.status = 'failed';
          typedFileData.error = failedFilesByName.get(fileName) || 'Unknown error';

          updatedFiles[fileId] = fileData;
          updatedFileIds.push(fileId);
        } else {
          // Unknown status, keep as is
          updatedFiles[fileId] = fileData;
          updatedFileIds.push(fileId);
        }
      }

      // Update the entry with the new file IDs and files
      typedEntry.file_ids = updatedFileIds;
      typedEntry.files = updatedFiles;

      // Update title based on success/failure counts
      if ('title' in entry) {
        const successCount = successfulFiles.length;
        const failedCount = failedFilesByName.size;
        const toolName = this.state.toolCallsInProgress.get(toolCallId)?.toolName;

        if (toolName) {
          let newTitle = '';
          let entityName = '';

          switch (toolName) {
            case 'createMetrics':
            case 'create-metrics-file':
              entityName = successCount === 1 ? 'metric' : 'metrics';
              if (failedCount > 0) {
                newTitle = `Created ${successCount} ${entityName}, ${failedCount} failed`;
              } else {
                newTitle = `Created ${successCount} ${entityName}`;
              }
              break;

            case 'createDashboards':
            case 'create-dashboards-file':
              entityName = successCount === 1 ? 'dashboard' : 'dashboards';
              if (failedCount > 0) {
                newTitle = `Created ${successCount} ${entityName}, ${failedCount} failed`;
              } else {
                newTitle = `Created ${successCount} ${entityName}`;
              }
              break;

            case 'modifyMetrics':
            case 'modify-metrics-file':
              entityName = successCount === 1 ? 'metric' : 'metrics';
              if (failedCount > 0) {
                newTitle = `Modified ${successCount} ${entityName}, ${failedCount} failed`;
              } else {
                newTitle = `Modified ${successCount} ${entityName}`;
              }
              break;

            case 'modifyDashboards':
            case 'modify-dashboards-file':
              entityName = successCount === 1 ? 'dashboard' : 'dashboards';
              if (failedCount > 0) {
                newTitle = `Modified ${successCount} ${entityName}, ${failedCount} failed`;
              } else {
                newTitle = `Modified ${successCount} ${entityName}`;
              }
              break;
          }

          if (newTitle) {
            (entry as ReasoningEntry & { title: string }).title = newTitle;
          }
        }
      }

      // After updating file statuses, re-evaluate file selection
      this.updateFileSelection();
    } catch (error) {
      console.error('Error updating file IDs and status from tool result:', {
        toolCallId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - continue processing
    }
  }

  /**
   * Update file IDs in reasoning entries from dummy IDs to actual tool result IDs
   * @deprecated Use updateFileIdsAndStatusFromToolResult instead
   */
  private updateFileIdsFromToolResult(toolCallId: string, toolResult: unknown): void {
    try {
      // Find the reasoning entry for this tool call
      const entry = this.state.reasoningHistory.find(
        (r) => r && typeof r === 'object' && 'id' in r && r.id === toolCallId
      );

      if (!entry || entry.type !== 'files') {
        return;
      }

      // Extract actual file IDs from tool result
      const actualFileIds = this.extractFileIdsFromToolResult(toolResult);
      if (actualFileIds.length === 0) {
        return;
      }

      // Update the reasoning entry with actual file IDs
      const typedEntry = entry as ReasoningEntry & {
        file_ids: string[];
        files: Record<string, unknown>;
      };

      // Create mapping from dummy IDs to actual IDs based on array position
      const idMapping = new Map<string, string>();
      const dummyIds = typedEntry.file_ids || [];

      // Map dummy IDs to actual IDs by position
      for (let i = 0; i < Math.min(dummyIds.length, actualFileIds.length); i++) {
        const dummyId = dummyIds[i];
        const actualId = actualFileIds[i];
        if (dummyId && actualId) {
          idMapping.set(dummyId, actualId);
        }
      }

      // Update file_ids array with actual IDs
      typedEntry.file_ids = actualFileIds;

      // Update files object - move from dummy ID keys to actual ID keys
      const updatedFiles: Record<string, unknown> = {};
      for (const [dummyId, actualId] of idMapping) {
        const fileData = typedEntry.files[dummyId];
        if (fileData && typeof fileData === 'object') {
          // Update the file data with actual ID
          const typedFileData = fileData as { id?: string };
          typedFileData.id = actualId;
          updatedFiles[actualId] = fileData;
        }
      }
      typedEntry.files = updatedFiles;
    } catch (error) {
      console.error('Error updating file IDs from tool result:', {
        toolCallId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - continue processing
    }
  }

  /**
   * Extract file IDs from tool result
   */
  private extractFileIdsFromToolResult(toolResult: unknown): string[] {
    try {
      if (!toolResult || typeof toolResult !== 'object') {
        return [];
      }

      const result = toolResult as Record<string, unknown>;

      // Check for files array in the result
      if ('files' in result && Array.isArray(result.files)) {
        const files = result.files as unknown[];
        return files
          .filter(
            (file): file is Record<string, unknown> =>
              file !== null && typeof file === 'object' && 'id' in file
          )
          .map((file) => (file as { id: string }).id)
          .filter((id): id is string => typeof id === 'string');
      }

      return [];
    } catch (error) {
      console.error('Error extracting file IDs from tool result:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Get timing data for debugging
   */
  getTimingData(): { startTime?: number; completedTools: number } {
    return {
      startTime: this.state.timing.startTime || 0,
      completedTools: this.state.timing.toolCallTimings.size,
    };
  }

  /**
   * Update the current file selection based on reasoning history
   * Re-evaluates which files should be shown based on priority logic
   */
  private updateFileSelection(): void {
    console.info('[ChunkProcessor] updateFileSelection called:', {
      dashboardContextLength: this.dashboardContext.length,
      dashboardContext: this.dashboardContext,
    });
    
    const allFiles = extractFilesFromReasoning(this.state.reasoningHistory);
    const selectedFiles = selectFilesForResponse(allFiles, this.dashboardContext);

    // Only update if selection changed
    if (JSON.stringify(selectedFiles) !== JSON.stringify(this.currentFileSelection.files)) {
      this.currentFileSelection = {
        files: selectedFiles,
        version: this.currentFileSelection.version + 1,
      };
      console.info('File selection updated:', {
        version: this.currentFileSelection.version,
        filesCount: selectedFiles.length,
        fileTypes: selectedFiles.map((f) => `${f.fileType}: ${f.fileName}`),
      });
    }
  }

  /**
   * Get the current file selection
   */
  getCurrentFileSelection(): { files: ExtractedFile[]; version: number } {
    return this.currentFileSelection;
  }

  /**
   * Get total number of files created (completed files only)
   */
  getTotalFilesCreated(): number {
    return extractFilesFromReasoning(this.state.reasoningHistory).length;
  }

  /**
   * Check if there are completed files in the reasoning history
   */
  private hasCompletedFiles(): boolean {
    return this.state.reasoningHistory.some(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        entry.type === 'files' &&
        entry.status === 'completed' &&
        entry.files &&
        Object.keys(entry.files).length > 0
    );
  }

  /**
   * Insert current file selection into response messages immediately
   * Called when doneTool is detected to ensure files are in response before streaming
   */
  private insertCurrentFileSelection(): void {
    if (this.currentFileSelection.files.length > 0 && !this.fileMessagesAdded) {
      const fileResponseMessages = createFileResponseMessages(this.currentFileSelection.files);

      // Add file messages to the beginning of response history
      this.state.responseHistory.unshift(...fileResponseMessages);
      this.fileMessagesAdded = true;

      console.info('Inserted file selection into response messages:', {
        fileCount: fileResponseMessages.length,
        fileTypes: this.currentFileSelection.files.map((f) => `${f.fileType}: ${f.fileName}`),
      });
    }
  }
}

import { updateMessageFields } from '@buster/database';
import type { CoreMessage, TextStreamPart, ToolSet } from 'ai';
import type { z } from 'zod';
import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '../../../../../server/src/types/chat-types/chat-message.type';
import { OptimisticJsonParser, getOptimisticValue } from '../streaming/optimistic-json-parser';
import { extractResponseMessages } from './format-llm-messages-as-reasoning';
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
  private readonly SAVE_THROTTLE_MS = 100; // Throttle saves to every 100ms
  private fileMessagesAdded = false; // Track if file messages have been added
  private deferDoneToolResponse = false; // Track if we should defer doneTool response
  private pendingDoneToolEntry: ResponseEntry | null = null; // Store deferred doneTool entry

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

      if (chunk.toolName === 'doneTool' && this.deferDoneToolResponse) {
        // Store as pending instead of adding to response history
        const responseEntry = this.createResponseEntry(
          chunk.toolCallId,
          chunk.toolName,
          parseResult
        );
        if (responseEntry) {
          this.pendingDoneToolEntry = responseEntry;
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

    // Create initial entries for both response and reasoning tools
    if (this.isResponseTool(chunk.toolName)) {
      // Check if this is doneTool and we have completed files
      if (chunk.toolName === 'doneTool' && this.hasCompletedFiles()) {
        // Mark that we should defer this response
        this.deferDoneToolResponse = true;
        // Don't create response entry yet - will be created during deltas/complete
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
        createMetrics: 'Creating metrics...',
        'create-metrics-file': 'Creating metrics...',
        createDashboards: 'Creating dashboards...',
        'create-dashboards-file': 'Creating dashboards...',
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

      // Check if this is a response tool
      const isResponseTool = this.isResponseTool(inProgress.toolName);

      if (isResponseTool) {
        // Handle response tools (doneTool, respondWithoutAnalysis)
        if (inProgress.toolName === 'doneTool' && this.deferDoneToolResponse) {
          // Update pending entry if exists, otherwise create new one
          if (this.pendingDoneToolEntry) {
            this.updateResponseEntryWithOptimisticValues(
              this.pendingDoneToolEntry,
              inProgress.toolName,
              parseResult
            );
          } else {
            const responseEntry = this.createResponseEntry(
              chunk.toolCallId,
              inProgress.toolName,
              parseResult
            );
            if (responseEntry) {
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
        this.updateReasoningEntryStatus(chunk.toolCallId, status, incrementalTime);
      }

      // Clear the tool call from tracking
      this.state.toolCallsInProgress.delete(chunk.toolCallId);

      // Force save after tool result
      await this.saveToDatabase();
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

  async saveToDatabase() {
    if (!this.messageId) {
      return;
    }

    // Skip save if we're deferring doneTool response and file messages haven't been added yet
    if (this.deferDoneToolResponse && !this.fileMessagesAdded) {
      return;
    }

    // If file messages have been added and we're trying to save with fewer messages, skip
    if (this.fileMessagesAdded && this.state.responseHistory.length < 2) {
      // Skip save to avoid overwriting file messages
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
        responseMessageIds?: string[];
      } = {
        rawLlmMessages: allMessages,
        reasoning: this.state.reasoningHistory,
      };

      if (this.state.responseHistory.length > 0) {
        // Keep as array format for the database
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
      console.error('Error saving chunk to database:', {
        messageId: this.messageId,
        messageCount: allMessages.length,
        reasoningCount: this.state.reasoningHistory.length,
        responseCount: this.state.responseHistory.length,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
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
            // Ensure file status property exists and is updated
            const fileObj = file as { status?: string; [key: string]: unknown };
            fileObj.status = status;

            // Log for debugging when marking files as failed
            if (status === 'failed') {
              console.warn(`Marking file ${fileId} as failed in reasoning entry ${toolCallId}`, {
                fileId,
                toolCallId,
                fileName: fileObj.file_name || 'unknown',
                entryStatus: entry.status,
              });
            }
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
                  version_number: 1,
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
                  version_number: 1,
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
        const statements = getOptimisticValue<string[]>(
          parseResult.extractedValues,
          'statements',
          []
        );
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
                  version_number: 1,
                  status: 'loading',
                  file: {
                    text: hasContent ? (file as { yml_content?: string }).yml_content || '' : '',
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
                  version_number: 1,
                  status: 'loading',
                  file: {
                    text: hasContent ? (file as { yml_content?: string }).yml_content || '' : '',
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

          // Update the entry
          (entry as ReasoningEntry & { file_ids: string[] }).file_ids = existingFileIds;
          entry.files = existingFiles;

          // Title stays static - "Modifying dashboards..."
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
          // Start with empty files - they'll be populated during streaming
          return {
            id: toolCallId,
            type: 'files',
            title: 'Creating metrics...',
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
              file_name: 'SQL Statements',
              version_number: 1,
              status: 'loading',
              file: {
                text: statementsYaml,
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

      case 'createDashboards':
      case 'create-dashboards-file':
        // Handle similar to createMetrics - expects files array with name and yml_content
        if (isCreateDashboardsArgs(args)) {
          // Start with empty files - they'll be populated during streaming
          return {
            id: toolCallId,
            type: 'files',
            title: 'Creating dashboards...',
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
          message = getOptimisticValue<string>(parseResult.extractedValues, 'response', '') || '';
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
        message = getOptimisticValue<string>(parseResult.extractedValues, 'response', '') || '';
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
   * Add response messages to the history
   * Used to add file response messages after done tool is called
   */
  async addResponseMessages(messages: ResponseEntry[]): Promise<void> {
    // Add new messages, avoiding duplicates by ID
    const existingIds = new Set(
      this.state.responseHistory
        .filter(
          (r): r is ResponseEntry & { id: string } =>
            r !== null && typeof r === 'object' && 'id' in r
        )
        .map((r) => r.id)
    );

    const newMessages = messages.filter((msg) => msg && 'id' in msg && !existingIds.has(msg.id));

    if (newMessages.length > 0) {
      // Insert at the beginning instead of the end
      this.state.responseHistory.unshift(...newMessages);
      // Mark that file messages have been added
      this.fileMessagesAdded = true;
      // Force an immediate save to persist the new messages
      await this.saveToDatabase();
    }
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
      if (!file?.file) {
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
              return {
                status: resultObj.status === 'error' ? 'error' : ('success' as const),
                sql: typeof resultObj.sql === 'string' ? resultObj.sql : '',
                results:
                  resultObj.status === 'success' && Array.isArray(resultObj.results)
                    ? (resultObj.results as Record<string, unknown>[])
                    : undefined,
                error_message:
                  resultObj.status === 'error' && typeof resultObj.error_message === 'string'
                    ? resultObj.error_message
                    : undefined,
              };
            });
          }
        }
      } catch (error) {
        console.error('Error parsing SQL tool result:', error);
        return;
      }

      // Format results as YAML and append to existing content
      const currentContent = file.file.text || '';
      let resultsYaml = '\n\nresults:';

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

      // Update the file content
      file.file.text = currentContent + resultsYaml;
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

      // Create mapping from dummy IDs to actual IDs based on array position
      const idMapping = new Map<string, string>();
      const dummyIds = typedEntry.file_ids || [];
      const actualIds = fileResults.map((result: { id: string }) => result.id);

      // Map dummy IDs to actual IDs by position
      for (let i = 0; i < Math.min(dummyIds.length, actualIds.length); i++) {
        const dummyId = dummyIds[i];
        const actualId = actualIds[i];
        if (dummyId && actualId) {
          idMapping.set(dummyId, actualId);
        }
      }

      // Update file_ids array with actual IDs
      typedEntry.file_ids = actualIds;

      // Update files object - move from dummy ID keys to actual ID keys and set individual statuses
      const updatedFiles: Record<string, unknown> = {};
      for (let i = 0; i < fileResults.length; i++) {
        const fileResult = fileResults[i];
        const dummyId = dummyIds[i];

        // Skip if fileResult is undefined
        if (!fileResult) {
          continue;
        }

        const actualId = fileResult.id;

        if (dummyId && actualId) {
          const fileData = typedEntry.files[dummyId];
          if (fileData && typeof fileData === 'object') {
            // Update the file data with actual ID and individual status
            const typedFileData = fileData as {
              id?: string;
              status?: string;
              error?: string;
              [key: string]: unknown;
            };
            typedFileData.id = actualId;
            typedFileData.status = fileResult.status;

            // Add error information if file failed
            if (fileResult.status === 'failed' && fileResult.error) {
              typedFileData.error = fileResult.error;
            }

            updatedFiles[actualId] = fileData;
          }
        }
      }
      typedEntry.files = updatedFiles;
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
      startTime: this.state.timing.startTime,
      completedTools: this.state.timing.toolCallTimings.size,
    };
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
   * Add file messages and deferred doneTool response together
   */
  async addFileAndDoneToolResponses(fileMessages: ResponseEntry[]): Promise<void> {
    // Add file messages first
    this.state.responseHistory.unshift(...fileMessages);

    // Now add the deferred doneTool response
    if (this.pendingDoneToolEntry) {
      this.state.responseHistory.push(this.pendingDoneToolEntry);
      this.pendingDoneToolEntry = null;
    }

    // Clear the defer flag and save
    this.deferDoneToolResponse = false;
    this.fileMessagesAdded = true;

    await this.saveToDatabase();
  }
}

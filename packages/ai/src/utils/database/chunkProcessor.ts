import { updateMessageFields } from '@buster/database';
import type { CoreMessage, TextStreamPart } from 'ai';
import type { z } from 'zod';
import {
  extractResponseMessages,
  formatLlmMessagesAsReasoning,
} from './formatLlmMessagesAsReasoning';

// Define the reasoning and response types
type ReasoningEntry = z.infer<typeof import('../memory/types').BusterChatMessageReasoningSchema>;
type ResponseEntry = z.infer<typeof import('../memory/types').BusterChatMessageResponseSchema>;

interface ToolCallInProgress {
  toolCallId: string;
  toolName: string;
  argsText: string;
  args?: Record<string, unknown>;
}

interface ChunkProcessorState {
  // Accumulated messages that form the conversation
  accumulatedMessages: CoreMessage[];

  // Current assistant message being built
  currentAssistantMessage: {
    role: 'assistant';
    content: Array<{ type: string; [key: string]: unknown }>;
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
    };
  }

  /**
   * Process a chunk and potentially save to database
   */
  async processChunk(chunk: TextStreamPart<any>): Promise<void> {
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

  private handleTextDelta(chunk: Extract<TextStreamPart<any>, { type: 'text-delta' }>) {
    if (!this.state.currentAssistantMessage) {
      this.state.currentAssistantMessage = {
        role: 'assistant',
        content: [],
      };
    }

    // Find or create text content part
    let textPart = this.state.currentAssistantMessage.content.find((part) => part.type === 'text');

    if (!textPart) {
      textPart = { type: 'text', text: '' };
      this.state.currentAssistantMessage.content.push(textPart);
    }

    textPart.text += chunk.textDelta || '';
  }

  private handleToolCall(chunk: Extract<TextStreamPart<any>, { type: 'tool-call' }>) {
    if (!this.state.currentAssistantMessage) {
      this.state.currentAssistantMessage = {
        role: 'assistant',
        content: [],
      };
    }

    const toolCall = {
      type: 'tool-call',
      toolCallId: chunk.toolCallId,
      toolName: chunk.toolName,
      args: chunk.args,
    };

    this.state.currentAssistantMessage.content.push(toolCall);

    // Check if this is a finishing tool
    if (['doneTool', 'respondWithoutAnalysis', 'submitThoughts'].includes(chunk.toolName)) {
      this.state.hasFinishingTool = true;
      this.state.finishedToolName = chunk.toolName;
    }
  }

  private handleToolCallStart(
    chunk: Extract<TextStreamPart<any>, { type: 'tool-call-streaming-start' }>
  ) {
    if (!this.state.currentAssistantMessage) {
      this.state.currentAssistantMessage = {
        role: 'assistant',
        content: [],
      };
    }

    const toolCall = {
      type: 'tool-call',
      toolCallId: chunk.toolCallId,
      toolName: chunk.toolName,
      args: {},
    };

    this.state.currentAssistantMessage.content.push(toolCall);

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

  private handleToolCallDelta(chunk: Extract<TextStreamPart<any>, { type: 'tool-call-delta' }>) {
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
          (part) =>
            part.type === 'tool-call' &&
            'toolCallId' in part &&
            part.toolCallId === chunk.toolCallId
        );
        if (toolCall) {
          toolCall.args = inProgress.args;
        }
      }
    } catch {
      // JSON is incomplete, continue accumulating
    }
  }

  private async handleToolResult(chunk: Extract<TextStreamPart<any>, { type: 'tool-result' }>) {
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

      // Extract reasoning from NEW messages only
      const newReasoningEntries = formatLlmMessagesAsReasoning(
        messagesToProcess
      ) as ReasoningEntry[];

      // Extract response messages from NEW messages only
      const newResponseEntries = extractResponseMessages(messagesToProcess) as ResponseEntry[];

      // Update reasoning history with new entries (deduplicate by ID)
      const existingIds = new Set(
        this.state.reasoningHistory
          .filter((r): r is { id: string } => r !== null && typeof r === 'object' && 'id' in r)
          .map((r) => r.id)
      );

      const deduplicatedNewReasoning = newReasoningEntries.filter(
        (entry) => entry && 'id' in entry && !existingIds.has(entry.id)
      );

      if (deduplicatedNewReasoning.length > 0) {
        this.state.reasoningHistory.push(...deduplicatedNewReasoning);
      }

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
}

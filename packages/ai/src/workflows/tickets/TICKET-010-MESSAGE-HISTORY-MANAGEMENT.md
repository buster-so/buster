# TICKET-010: Message History Management

**Priority**: 🟡 High  
**Estimated Effort**: 2-3 days  
**Dependencies**: TICKET-005 (Resource Limits), TICKET-006 (Database Safety)  
**Blocks**: None

## Problem Statement

Message history management lacks size limits, aging mechanisms, and cleanup procedures, leading to potential memory growth and database bloat over time. Long conversations could cause performance degradation.

## Current Issues

### Missing Controls:
- No conversation history size limits
- No conversation aging/cleanup mechanisms
- Potential unbounded memory growth with long conversations
- No archival strategy for old conversations
- Missing conversation statistics and monitoring

### Performance Risks:
- Large conversation histories slow down retrieval
- Memory usage grows linearly with conversation length
- Database queries become slower with large JSON fields
- No pagination for conversation history

## Scope

### Files to Modify:
- `src/utils/memory/message-history.ts`
- `src/utils/database/saveConversationHistory.ts`
- `src/utils/conversation-management.ts` (new file)
- `src/utils/conversation-archival.ts` (new file)
- `src/steps/get-chat-history.ts`

### Changes Required:

#### 1. Create Conversation Management Utilities
```typescript
// src/utils/conversation-management.ts
import type { CoreMessage } from 'ai';
import { RESOURCE_LIMITS } from './resource-limits';
import type { MessageHistory } from './memory/types';

export interface ConversationStats {
  totalMessages: number;
  totalSizeBytes: number;
  userMessages: number;
  assistantMessages: number;
  toolMessages: number;
  oldestMessageDate?: Date;
  newestMessageDate?: Date;
}

export interface ConversationWindow {
  messages: MessageHistory;
  totalMessages: number;
  windowStart: number;
  windowEnd: number;
  hasMore: boolean;
}

export class ConversationTooLargeError extends Error {
  constructor(
    public readonly currentSize: number,
    public readonly maxSize: number,
    public readonly unit: string
  ) {
    super(`Conversation too large: ${currentSize}${unit} exceeds limit of ${maxSize}${unit}`);
    this.name = 'ConversationTooLargeError';
  }
}

export function calculateConversationStats(messages: MessageHistory): ConversationStats {
  const stats: ConversationStats = {
    totalMessages: messages.length,
    totalSizeBytes: estimateMessageSize(messages),
    userMessages: 0,
    assistantMessages: 0,
    toolMessages: 0,
  };

  const timestamps: Date[] = [];

  for (const message of messages) {
    switch (message.role) {
      case 'user':
        stats.userMessages++;
        break;
      case 'assistant':
        stats.assistantMessages++;
        break;
      case 'tool':
        stats.toolMessages++;
        break;
    }

    // Extract timestamps if available
    if ('timestamp' in message && message.timestamp) {
      timestamps.push(new Date(message.timestamp as string));
    }
  }

  if (timestamps.length > 0) {
    stats.oldestMessageDate = new Date(Math.min(...timestamps.map(d => d.getTime())));
    stats.newestMessageDate = new Date(Math.max(...timestamps.map(d => d.getTime())));
  }

  return stats;
}

export function estimateMessageSize(messages: MessageHistory): number {
  return JSON.stringify(messages).length * 2; // Rough estimate: 2 bytes per character
}

export function validateConversationSize(messages: MessageHistory): void {
  const stats = calculateConversationStats(messages);
  
  // Check message count limit
  if (stats.totalMessages > RESOURCE_LIMITS.MAX_CONVERSATION_HISTORY_MESSAGES) {
    throw new ConversationTooLargeError(
      stats.totalMessages,
      RESOURCE_LIMITS.MAX_CONVERSATION_HISTORY_MESSAGES,
      ' messages'
    );
  }

  // Check size limit
  const sizeMB = stats.totalSizeBytes / (1024 * 1024);
  if (sizeMB > RESOURCE_LIMITS.MAX_CONVERSATION_HISTORY_SIZE_MB) {
    throw new ConversationTooLargeError(
      Math.round(sizeMB),
      RESOURCE_LIMITS.MAX_CONVERSATION_HISTORY_SIZE_MB,
      'MB'
    );
  }
}

export function trimConversationHistory(
  messages: MessageHistory,
  options: {
    maxMessages?: number;
    maxSizeMB?: number;
    preserveFirstUserMessage?: boolean;
    preserveRecentContext?: number; // Number of recent message pairs to preserve
  } = {}
): MessageHistory {
  const {
    maxMessages = RESOURCE_LIMITS.MAX_CONVERSATION_HISTORY_MESSAGES,
    maxSizeMB = RESOURCE_LIMITS.MAX_CONVERSATION_HISTORY_SIZE_MB,
    preserveFirstUserMessage = true,
    preserveRecentContext = 5, // Preserve last 5 exchanges
  } = options;

  if (messages.length === 0) {
    return messages;
  }

  let trimmedMessages = [...messages];
  
  // First, check if we need to trim by count
  if (trimmedMessages.length > maxMessages) {
    const preservedMessages: MessageHistory = [];
    
    // Preserve first user message if requested
    if (preserveFirstUserMessage) {
      const firstUserMessage = trimmedMessages.find(m => m.role === 'user');
      if (firstUserMessage) {
        preservedMessages.push(firstUserMessage);
      }
    }
    
    // Preserve recent context (last N message pairs)
    const recentMessages = trimmedMessages.slice(-preserveRecentContext * 2);
    preservedMessages.push(...recentMessages);
    
    // Remove duplicates while preserving order
    const seen = new Set();
    trimmedMessages = preservedMessages.filter(msg => {
      const key = JSON.stringify(msg);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Then, check if we need to trim by size
  let currentSizeMB = estimateMessageSize(trimmedMessages) / (1024 * 1024);
  
  while (currentSizeMB > maxSizeMB && trimmedMessages.length > preserveRecentContext) {
    // Remove messages from the middle, keeping first and last few
    const middleIndex = Math.floor(trimmedMessages.length / 2);
    trimmedMessages.splice(middleIndex, 1);
    currentSizeMB = estimateMessageSize(trimmedMessages) / (1024 * 1024);
  }

  return trimmedMessages;
}

export function getConversationWindow(
  messages: MessageHistory,
  windowSize: number = 50,
  offset: number = 0
): ConversationWindow {
  const totalMessages = messages.length;
  const windowStart = Math.max(0, totalMessages - windowSize - offset);
  const windowEnd = Math.max(0, totalMessages - offset);
  
  return {
    messages: messages.slice(windowStart, windowEnd),
    totalMessages,
    windowStart,
    windowEnd,
    hasMore: windowStart > 0,
  };
}

export function shouldTrimConversation(messages: MessageHistory): boolean {
  const stats = calculateConversationStats(messages);
  
  return (
    stats.totalMessages > RESOURCE_LIMITS.MAX_CONVERSATION_HISTORY_MESSAGES * 0.8 ||
    stats.totalSizeBytes / (1024 * 1024) > RESOURCE_LIMITS.MAX_CONVERSATION_HISTORY_SIZE_MB * 0.8
  );
}
```

#### 2. Create Conversation Archival System
```typescript
// src/utils/conversation-archival.ts
import { getDb } from '@buster/database';
import { eq } from 'drizzle-orm';
import { messages } from '@buster/database/schema';
import type { MessageHistory } from './memory/types';
import { estimateMessageSize, calculateConversationStats } from './conversation-management';

export interface ArchivedConversation {
  messageId: string;
  originalSize: number;
  archivedSize: number;
  archiveDate: Date;
  compressionRatio: number;
}

export async function archiveOldConversation(
  messageId: string,
  maxAgeDays: number = 30
): Promise<ArchivedConversation | null> {
  const db = getDb();
  
  try {
    // Get the message and check age
    const messageRecord = await db
      .select({
        id: messages.id,
        rawLlmMessages: messages.rawLlmMessages,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!messageRecord[0]) {
      return null;
    }

    const message = messageRecord[0];
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

    if (messageAge < maxAgeMs) {
      return null; // Not old enough to archive
    }

    const originalMessages = message.rawLlmMessages as MessageHistory;
    if (!originalMessages || originalMessages.length === 0) {
      return null;
    }

    const originalSize = estimateMessageSize(originalMessages);
    
    // Create compressed/summarized version
    const archivedMessages = await compressConversationHistory(originalMessages);
    const archivedSize = estimateMessageSize(archivedMessages);
    
    // Update the message with archived version
    await db
      .update(messages)
      .set({
        rawLlmMessages: archivedMessages,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(messages.id, messageId));

    return {
      messageId,
      originalSize,
      archivedSize,
      archiveDate: new Date(),
      compressionRatio: originalSize / archivedSize,
    };

  } catch (error) {
    console.error(`Failed to archive conversation ${messageId}:`, error);
    throw error;
  }
}

async function compressConversationHistory(messages: MessageHistory): Promise<MessageHistory> {
  // Simple compression strategy: keep first and last few messages, summarize middle
  if (messages.length <= 10) {
    return messages; // Too short to compress
  }

  const compressed: MessageHistory = [];
  
  // Keep first 3 messages
  compressed.push(...messages.slice(0, 3));
  
  // Add summary of middle messages if there are enough
  if (messages.length > 10) {
    const middleMessages = messages.slice(3, -3);
    const summary = await summarizeMessages(middleMessages);
    
    compressed.push({
      role: 'assistant',
      content: `[Archived summary: This conversation included ${middleMessages.length} messages with analysis and tool usage. ${summary}]`,
    });
  }
  
  // Keep last 3 messages
  compressed.push(...messages.slice(-3));
  
  return compressed;
}

async function summarizeMessages(messages: MessageHistory): Promise<string> {
  const stats = calculateConversationStats(messages);
  
  // Simple rule-based summarization
  const summary = [
    `${stats.userMessages} user messages`,
    `${stats.assistantMessages} assistant responses`,
    stats.toolMessages > 0 ? `${stats.toolMessages} tool executions` : null,
  ].filter(Boolean).join(', ');

  return summary;
}

export async function cleanupOldConversations(
  maxAgeDays: number = 90,
  batchSize: number = 100
): Promise<{
  processed: number;
  archived: number;
  errors: number;
}> {
  const db = getDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
  
  let processed = 0;
  let archived = 0;
  let errors = 0;
  
  try {
    // Get old messages in batches
    const oldMessages = await db
      .select({
        id: messages.id,
      })
      .from(messages)
      .where(eq(messages.createdAt, cutoffDate.toISOString()))
      .limit(batchSize);

    for (const message of oldMessages) {
      try {
        const result = await archiveOldConversation(message.id, maxAgeDays);
        processed++;
        if (result) {
          archived++;
        }
      } catch (error) {
        console.error(`Failed to process message ${message.id}:`, error);
        errors++;
      }
    }

  } catch (error) {
    console.error('Failed to cleanup old conversations:', error);
    throw error;
  }

  return { processed, archived, errors };
}

// Schedule periodic cleanup
export function scheduleConversationCleanup(intervalHours: number = 24): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      console.log('Starting scheduled conversation cleanup...');
      const result = await cleanupOldConversations();
      console.log('Conversation cleanup completed:', result);
    } catch (error) {
      console.error('Scheduled conversation cleanup failed:', error);
    }
  }, intervalHours * 60 * 60 * 1000);
}
```

#### 3. Update Message History Utilities
```typescript
// Update src/utils/memory/message-history.ts
import { 
  validateConversationSize, 
  trimConversationHistory, 
  shouldTrimConversation,
  calculateConversationStats 
} from '../conversation-management';

export function extractMessageHistory(stepMessages: any[]): MessageHistory {
  if (!Array.isArray(stepMessages)) {
    console.error('Invalid message history format: not an array');
    return [];
  }

  const messages = stepMessages as CoreMessage[];
  
  // Validate conversation size before returning
  try {
    validateConversationSize(messages);
    return messages;
  } catch (error) {
    if (error instanceof ConversationTooLargeError) {
      console.warn('Conversation too large, trimming:', error.message);
      return trimConversationHistory(messages);
    }
    throw error;
  }
}

export function formatMessagesForAnalyst(
  messages: MessageHistory,
  initialPrompt?: string
): CoreMessage[] {
  // Check if conversation should be trimmed before processing
  if (shouldTrimConversation(messages)) {
    console.log('Trimming conversation history for analyst processing');
    messages = trimConversationHistory(messages, {
      preserveFirstUserMessage: true,
      preserveRecentContext: 10, // Keep more context for analyst
    });
  }

  const formattedMessages: CoreMessage[] = [];

  // Check if we already have a user message with the initial prompt
  const hasInitialPrompt = messages.some(
    (msg) => msg.role === 'user' && typeof msg.content === 'string' && msg.content === initialPrompt
  );

  // Add initial prompt if not present
  if (initialPrompt && !hasInitialPrompt) {
    formattedMessages.push({
      role: 'user',
      content: initialPrompt,
    });
  }

  // Add all the messages from think-and-prep
  formattedMessages.push(...messages);

  return formattedMessages;
}

// Add conversation monitoring
export function getConversationHealthMetrics(messages: MessageHistory): {
  stats: ReturnType<typeof calculateConversationStats>;
  needsTrimming: boolean;
  recommendedAction: 'none' | 'trim' | 'archive';
} {
  const stats = calculateConversationStats(messages);
  const needsTrimming = shouldTrimConversation(messages);
  
  let recommendedAction: 'none' | 'trim' | 'archive' = 'none';
  
  if (stats.totalMessages > RESOURCE_LIMITS.MAX_CONVERSATION_HISTORY_MESSAGES * 0.9) {
    recommendedAction = 'archive';
  } else if (needsTrimming) {
    recommendedAction = 'trim';
  }

  return {
    stats,
    needsTrimming,
    recommendedAction,
  };
}
```

#### 4. Update Database Save with Size Management
```typescript
// Update src/utils/database/saveConversationHistory.ts
import { 
  validateConversationSize, 
  trimConversationHistory, 
  shouldTrimConversation 
} from '../conversation-management';

export async function saveConversationHistoryFromStep(
  runtimeContext: { get: (key: string) => any },
  stepMessages: any[]
): Promise<void> {
  const messageId = runtimeContext.get('messageId');

  if (!messageId) {
    return;
  }

  try {
    let messagesToSave = stepMessages as CoreMessage[];
    
    // Check if conversation needs trimming before saving
    if (shouldTrimConversation(messagesToSave)) {
      console.log('Trimming conversation before saving to database');
      messagesToSave = trimConversationHistory(messagesToSave, {
        preserveFirstUserMessage: true,
        preserveRecentContext: 15, // Keep more context in database
      });
    }

    // Final validation before saving
    validateConversationSize(messagesToSave);

    const db = getDb();

    // Get current reasoning and append to it
    const currentMessage = await db
      .select({ reasoning: messages.reasoning })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    const currentReasoning = Array.isArray(currentMessage[0]?.reasoning)
      ? currentMessage[0].reasoning
      : [];

    const updatedReasoning = appendToReasoning(currentReasoning, messagesToSave);

    // Update both rawLlmMessages and reasoning
    await updateMessageFields(messageId, {
      rawLlmMessages: messagesToSave,
      reasoning: updatedReasoning,
    });

    // Log conversation statistics
    const stats = calculateConversationStats(messagesToSave);
    console.log('Conversation saved:', {
      messageId,
      totalMessages: stats.totalMessages,
      sizeMB: Math.round(stats.totalSizeBytes / 1024 / 1024 * 100) / 100,
    });

  } catch (error) {
    console.error('Failed to save conversation history and reasoning:', error);
    throw new Error(
      `Failed to save conversation history and reasoning: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
```

#### 5. Update Get Chat History with Pagination
```typescript
// Update src/steps/get-chat-history.ts
import { getConversationWindow } from '../utils/conversation-management';

export async function getRawLlmMessagesByMessageId(
  messageId: string,
  options: {
    windowSize?: number;
    offset?: number;
  } = {}
): Promise<MessageHistory | null> {
  const result = await getDbRawLlmMessages(messageId);
  
  if (!result) {
    return null;
  }

  const messages = result as MessageHistory;
  
  // Return windowed results if requested
  if (options.windowSize) {
    const window = getConversationWindow(messages, options.windowSize, options.offset);
    return window.messages;
  }

  return messages;
}

export async function getRawLlmMessagesWindow(
  messageId: string,
  windowSize: number = 50,
  offset: number = 0
): Promise<{
  messages: MessageHistory;
  totalMessages: number;
  hasMore: boolean;
} | null> {
  const result = await getDbRawLlmMessages(messageId);
  
  if (!result) {
    return null;
  }

  const allMessages = result as MessageHistory;
  const window = getConversationWindow(allMessages, windowSize, offset);
  
  return {
    messages: window.messages,
    totalMessages: window.totalMessages,
    hasMore: window.hasMore,
  };
}
```

## Acceptance Criteria

- [ ] Conversation history size is limited and enforced
- [ ] Automatic trimming preserves important context
- [ ] Old conversations are archived and compressed
- [ ] Pagination available for large conversations
- [ ] Conversation health monitoring and metrics
- [ ] Memory usage is bounded for long conversations
- [ ] Database performance is maintained with large histories

## Test Plan

- [ ] Test conversation size validation and trimming
- [ ] Test archival system with old conversations
- [ ] Test pagination with large conversation histories
- [ ] Test memory usage with very long conversations
- [ ] Test conversation statistics and health metrics
- [ ] Test cleanup job performance

## Configuration

Add environment variables:
```bash
# Conversation management
MAX_CONVERSATION_HISTORY_MESSAGES=1000
MAX_CONVERSATION_HISTORY_SIZE_MB=10
CONVERSATION_ARCHIVE_AGE_DAYS=30
CONVERSATION_CLEANUP_INTERVAL_HOURS=24
CONVERSATION_WINDOW_SIZE=50
```

## Monitoring

Add conversation health metrics:
```typescript
export const conversationMetrics = {
  conversationSize: new Histogram('conversation_size_bytes'),
  conversationLength: new Histogram('conversation_message_count'),
  trimOperations: new Counter('conversation_trim_operations'),
  archiveOperations: new Counter('conversation_archive_operations'),
};
```

## Notes

This ticket depends on resource limits (TICKET-005) for size validation and database safety (TICKET-006) for reliable archival operations. It prevents long-term memory and database growth issues.
import type { ModelMessage } from 'ai';
import { LRUCache } from 'lru-cache';
import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '../../schemas/message-schemas';

export interface MessageEntriesCacheValue {
  responseMessages: ChatMessageResponseMessage[];
  reasoning: ChatMessageReasoningMessage[];
  rawLlmMessages: ModelMessage[];
}

interface CacheOptions {
  max?: number;
  ttl?: number;
}

class MessageEntriesCache {
  private cache: LRUCache<string, MessageEntriesCacheValue>;
  private static instance: MessageEntriesCache;

  private constructor(options: CacheOptions = {}) {
    this.cache = new LRUCache<string, MessageEntriesCacheValue>({
      max: options.max ?? 100,
      ttl: options.ttl ?? 1000 * 60 * 2, // 2 minutes TTL
      updateAgeOnGet: true, // Refresh TTL on read
      updateAgeOnHas: true, // Refresh TTL on has check
    });
  }

  static getInstance(options?: CacheOptions): MessageEntriesCache {
    if (!MessageEntriesCache.instance) {
      MessageEntriesCache.instance = new MessageEntriesCache(options);
    }
    return MessageEntriesCache.instance;
  }

  get(messageId: string): MessageEntriesCacheValue | undefined {
    return this.cache.get(messageId);
  }

  set(messageId: string, value: MessageEntriesCacheValue): void {
    this.cache.set(messageId, value);
  }

  has(messageId: string): boolean {
    return this.cache.has(messageId);
  }

  delete(messageId: string): boolean {
    return this.cache.delete(messageId);
  }

  clear(): void {
    this.cache.clear();
  }

  /**
   * Updates cached entry with partial data
   */
  update(messageId: string, partialValue: Partial<MessageEntriesCacheValue>): void {
    const existing = this.get(messageId);
    if (existing) {
      this.set(messageId, {
        ...existing,
        ...partialValue,
      });
    } else {
      // If not in cache, set with defaults for missing fields
      this.set(messageId, {
        responseMessages: partialValue.responseMessages ?? [],
        reasoning: partialValue.reasoning ?? [],
        rawLlmMessages: partialValue.rawLlmMessages ?? [],
      });
    }
  }
}

export const messageEntriesCache = MessageEntriesCache.getInstance();

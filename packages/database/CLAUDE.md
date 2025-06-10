# CLAUDE.md - Database Package

This file provides guidance to Claude Code when working with the database package.

## Overview

The `@buster/database` package provides the database schema, types, and helper functions for the Buster application. It uses Drizzle ORM for type-safe database operations and PostgreSQL as the database.

## Package Structure

```
packages/database/
├── src/
│   ├── connection.ts      # Database connection setup
│   ├── schema.ts          # Database table definitions
│   ├── relations.ts       # Table relationships
│   ├── enums.ts          # Enum type definitions
│   ├── helpers/          # Database helper functions
│   │   ├── index.ts      # Helper exports
│   │   └── messages.ts   # Message-related helpers
│   └── index.ts          # Package exports
├── migrations/           # Database migration files
└── tests/               # Database tests
```

## Database Helpers

### Message Helpers (`src/helpers/messages.ts`)

The message helpers provide clean abstractions for working with the messages table:

```typescript
// Get raw LLM messages for a specific message ID
getRawLlmMessages(messageId: string): Promise<any>

// Get all messages for a chat
getMessagesForChat(chatId: string): Promise<Message[]>

// Get the latest message in a chat
getLatestMessageForChat(chatId: string): Promise<Message | null>

// Get completed messages for a chat
getCompletedMessagesForChat(chatId: string): Promise<Message[]>

// Get all raw LLM messages for an entire chat
getAllRawLlmMessagesForChat(chatId: string): Promise<{
  messageId: string;
  rawLlmMessages: any;
  createdAt: Date;
}[]>
```

### Usage Examples

```typescript
import { getRawLlmMessages, getAllRawLlmMessagesForChat } from '@buster/database';

// Fetch conversation history for a specific message
const conversationHistory = await getRawLlmMessages(messageId);

// Fetch all conversation histories for a chat
const allHistories = await getAllRawLlmMessagesForChat(chatId);
```

## Key Tables

### Messages Table
- `id`: UUID primary key
- `chatId`: Foreign key to chats table
- `userId`: Foreign key to users table
- `rawLlmMessages`: JSONB field storing conversation history (array of CoreMessage objects)
- `requestMessage`: User's request text
- `responseMessages`: Assistant's response (JSONB)
- `reasoning`: Reasoning steps (JSONB)
- `isCompleted`: Boolean flag
- `createdAt`, `updatedAt`, `deletedAt`: Timestamps

## Best Practices

1. **Use Helpers Over Direct Queries**: Always prefer the helper functions over direct database queries for better maintainability
2. **Handle Soft Deletes**: The helpers automatically filter out soft-deleted records (where `deletedAt` is not null)
3. **Type Safety**: Use the exported types (`Message`, etc.) for type-safe operations
4. **Error Handling**: Helpers return null or empty arrays when no data is found

## Development Commands

```bash
# Run database migrations
npm run db:migrate

# Generate TypeScript types from schema
npm run db:generate

# Run database tests
npm run test packages/database
```

## Integration with AI Package

The database helpers are used by the AI package for managing conversation history:

1. During workflow execution, `rawLlmMessages` are saved to the database when a `messageId` is provided
2. The AI package's `get-chat-history.ts` uses these database helpers to fetch conversation history
3. This enables multi-turn conversations by retrieving previous message history

Example flow:
```typescript
// In AI workflow
if (messageId) {
  // Save conversation history to database
  await saveConversationHistory(messageId, messages);
}

// Later, retrieve history
const history = await getRawLlmMessages(messageId);
```
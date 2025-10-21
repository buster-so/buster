# CLI API-First Refactoring: Comprehensive Task Document

## Overview

This refactoring transforms the CLI from a hybrid local-file + API sync architecture to a pure API-first approach. The current system maintains conversation state in both local files (`~/.buster/history`) and the API, creating unnecessary complexity, sync issues, and potential data inconsistencies.

**Goals:**
- Eliminate local file storage for conversations
- Use API as the single source of truth
- Simplify conversation management logic
- Improve reliability and reduce sync bugs
- Maintain existing user experience with better backend architecture

**Benefits:**
- No more sync issues between local and API state
- Consistent conversation state across devices
- Simplified codebase with fewer edge cases
- Better offline error handling (fail fast vs. silent failures)
- Foundation for future features (multi-device sync, cloud backups)

## Current Architecture

### How It Works Now

**Interactive Mode (`main.tsx`):**
1. User starts CLI → generates chatId locally
2. On message send:
   - Saves messages to `~/.buster/history/{workingDir}/{chatId}.json`
   - Optionally syncs to API (if credentials available)
   - Updates local file after agent execution
3. History browser reads from local files
4. Resume loads from local files (with API fallback)

**Headless Mode (`headless-service.ts`):**
1. Accepts optional `chatId` and `messageId` flags
2. Loads conversation from local files
3. Saves updates to local files
4. Optionally syncs to API

**Problems:**
- **Dual source of truth**: Local files and API can diverge
- **Sync complexity**: `load-conversation-from-api.ts` tries to reconcile both sources
- **Offline assumptions**: Code assumes local files are authoritative
- **Migration issues**: No clear path for existing local conversations
- **File system coupling**: Tied to specific directory structures

## Target Architecture

### How It Will Work

**Interactive Mode (`main.tsx`):**
1. User starts CLI → generates chatId locally (no API call yet)
2. On first message:
   - Generate chatId and messageId
   - Call `sdk.messages.create(chatId, messageId, { prompt })` - creates chat + message via upsert
   - Stream agent execution
   - Update raw LLM messages via `sdk.messages.update(chatId, messageId, { rawLlmMessages })`
3. On subsequent messages:
   - Fetch conversation via `sdk.messages.getRawMessages(chatId)`
   - Generate new messageId
   - Call `sdk.messages.create(chatId, messageId, { prompt })`
   - Update raw LLM messages as agent executes
4. History browser fetches from API via `sdk.chats.list()`
5. Resume loads from API via `sdk.messages.getRawMessages(chatId)`

**Headless Mode (`headless-service.ts`):**
1. Support optional `--chat-id` and `--message-id` flags
2. If chatId provided:
   - Fetch existing conversation via `sdk.messages.getRawMessages(chatId)`
   - If messageId provided: overwrite that specific message record
   - If no messageId: generate new messageId and create new message
3. If neither provided:
   - Generate new chatId and messageId
   - Create new conversation
4. All updates go through API

**Benefits:**
- **Single source of truth**: API is authoritative
- **Simplified logic**: No file I/O, no sync reconciliation
- **Clear error handling**: Network failures are explicit, not silent
- **Multi-device ready**: Conversations accessible from any machine
- **No file system assumptions**: Works regardless of working directory

## TDD Principles

**Critical Rule: Tests MUST be written FIRST for every task.**

### Testing Philosophy

1. **Red-Green-Refactor Cycle**:
   - Write failing tests that specify the desired behavior
   - Implement minimum code to make tests pass
   - Refactor while keeping tests green

2. **Test Coverage Requirements**:
   - Every pure function must have unit tests
   - Every API interaction must have integration tests
   - Every Zod schema must have validation tests
   - Every error path must be tested

3. **Test Organization**:
   - `*.test.ts` - Unit tests (pure functions, no I/O)
   - `*.int.test.ts` - Integration tests (API calls, file I/O)
   - Colocate tests with implementation files

4. **Mocking Strategy**:
   - Mock SDK calls in unit tests
   - Use real SDK (with test server) in integration tests
   - Mock file system in all new tests (we're removing file dependency)

### Example TDD Workflow

```typescript
// Step 1: Write failing test
describe('loadConversationFromApi', () => {
  it('should fetch conversation from API when chatId exists', async () => {
    const mockSdk = {
      messages: {
        getRawMessages: jest.fn().mockResolvedValue({
          success: true,
          chatId: 'test-id',
          rawLlmMessages: [{ role: 'user', content: 'Hello' }]
        })
      }
    };

    const result = await loadConversationFromApi('test-id', mockSdk);

    expect(result).toEqual({
      chatId: 'test-id',
      modelMessages: [{ role: 'user', content: 'Hello' }]
    });
  });
});

// Step 2: Implement function to pass test
export async function loadConversationFromApi(
  chatId: string,
  sdk: BusterSDK
): Promise<Conversation | null> {
  const response = await sdk.messages.getRawMessages(chatId);
  if (!response.success) return null;

  return {
    chatId,
    modelMessages: response.rawLlmMessages as ModelMessage[]
  };
}

// Step 3: Refactor while keeping tests green
```

## Breaking Changes

### For End Users

**Minimal Impact:**
- Existing local conversations in `~/.buster/history` will still work during transition
- History browser will prioritize API conversations, fall back to local files
- Offline mode will fail gracefully with clear error messages (instead of silent local-only mode)

**Migration Strategy:**
- Phase 1: Add API-first code paths alongside existing local file logic
- Phase 2: Default to API-first, fall back to local files
- Phase 3: Deprecate local file reading (write-only for backup)
- Phase 4: Remove local file logic entirely

### For Developers

**API Changes:**
- `loadConversation()` signature changes to be async and API-first
- `saveModelMessages()` replaced with SDK calls
- `listConversations()` fetches from API instead of filesystem
- Session management no longer depends on file system

**Removed Files:**
- `conversation-history.ts` - replaced by API calls
- `load-conversation-from-api.ts` - no longer needed (API is primary)

**Modified Files:**
- `main.tsx` - use SDK for all conversation operations
- `chat-service.ts` - already uses SDK, simplify logic
- `headless-service.ts` - add chatId/messageId flag support
- `history-browser.tsx` - fetch from API
- `session.ts` - remove file system dependencies

## Implementation Tasks

### Phase 1: SDK Enhancements & Type Foundations

#### Task 1.1: Add List Chats Endpoint to SDK

**TEST FIRST:**
- **File**: `/Users/dallin/worktrees/finish-up-tui/packages/sdk/src/lib/client/buster-sdk.test.ts`
- **Test cases**:
  ```typescript
  describe('BusterSDK.chats.list', () => {
    it('should fetch paginated chat list from API', async () => {
      // Mock GET /public/chats with pagination params
      // Assert correct request format and response parsing
    });

    it('should handle empty chat list', async () => {
      // Mock empty response
      // Assert returns empty array
    });

    it('should handle API errors gracefully', async () => {
      // Mock 500 error
      // Assert throws appropriate error
    });
  });
  ```

**Implementation:**
- Add `chats.list()` method to SDK
- Use existing `GetChatsListRequestSchema` and `GetChatsListResponseSchema` from server-shared
- Support pagination parameters

**Type Safety:**
- Import schemas from `@buster/server-shared/chats`
- Use Zod validation for response

**Composability:**
- Pure function, no side effects
- Returns typed promise
- Dependency injection via SDK config

**Files to modify:**
- `/Users/dallin/worktrees/finish-up-tui/packages/sdk/src/lib/client/buster-sdk.ts`

**Dependencies:** None

---

#### Task 1.2: Create API-First Conversation Loader Utility

**TEST FIRST:**
- **File**: `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/api-conversation.test.ts`
- **Test cases**:
  ```typescript
  describe('loadConversationFromApi', () => {
    it('should load conversation from API successfully', async () => {
      // Mock SDK getRawMessages response
      // Assert returns Conversation with correct structure
    });

    it('should return null when conversation not found', async () => {
      // Mock 404 response
      // Assert returns null (not throw)
    });

    it('should handle network errors', async () => {
      // Mock network failure
      // Assert throws descriptive error
    });

    it('should validate response schema', async () => {
      // Mock malformed response
      // Assert throws validation error
    });
  });

  describe('saveConversationToApi', () => {
    it('should create new message in API', async () => {
      // Mock SDK messages.create
      // Assert called with correct parameters
    });

    it('should update existing message with raw LLM messages', async () => {
      // Mock SDK messages.update
      // Assert rawLlmMessages passed correctly
    });
  });

  describe('listConversationsFromApi', () => {
    it('should fetch and transform chat list', async () => {
      // Mock SDK chats.list
      // Assert transforms ChatListItem[] to conversation metadata
    });
  });
  ```

**Implementation:**
- Create `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/api-conversation.ts`
- Implement pure functions:
  - `loadConversationFromApi(chatId, sdk)`
  - `saveConversationToApi(chatId, messageId, data, sdk)`
  - `listConversationsFromApi(sdk, workingDirectory?)`

**Type Safety:**
- Define Zod schemas for conversation metadata
- Use TypeScript discriminated unions for operation results
- Export inferred types

**Composability:**
- Pure functions with explicit dependencies (SDK passed as parameter)
- No global state
- Composable error handling (return Result types or throw)

**Files to create:**
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/api-conversation.ts`
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/api-conversation.test.ts`

**Dependencies:** Task 1.1

---

#### Task 1.3: Create SDK Factory with Credentials

**TEST FIRST:**
- **File**: `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/sdk-factory.test.ts`
- **Test cases**:
  ```typescript
  describe('createAuthenticatedSdk', () => {
    it('should create SDK with valid credentials', async () => {
      // Mock getCredentials to return valid auth
      // Assert SDK created with correct config
    });

    it('should throw when credentials missing', async () => {
      // Mock getCredentials to return null
      // Assert throws descriptive error
    });

    it('should handle invalid credentials gracefully', async () => {
      // Mock getCredentials with invalid auth
      // Assert error message guides user to login
    });
  });

  describe('getOrCreateSdk', () => {
    it('should return cached SDK instance', async () => {
      // Call twice
      // Assert returns same instance
    });

    it('should create new SDK if not cached', async () => {
      // First call
      // Assert creates new instance
    });
  });
  ```

**Implementation:**
- Create `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/sdk-factory.ts`
- Implement:
  - `createAuthenticatedSdk()` - creates SDK with credentials
  - `getOrCreateSdk()` - singleton pattern with lazy initialization

**Type Safety:**
- Return `BusterSDK` type from SDK package
- Handle null credentials with clear error types

**Composability:**
- Factory function pattern
- Explicit error handling
- Optional caching for performance

**Files to create:**
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/sdk-factory.ts`
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/sdk-factory.test.ts`

**Dependencies:** None

---

### Phase 2: Core Service Refactoring

#### Task 2.1: Refactor Chat Service to Pure API

**TEST FIRST:**
- **File**: `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/services/chat-service.test.ts` (modify existing)
- **Test cases**:
  ```typescript
  describe('runChatAgent - API-first', () => {
    it('should create message in API before agent execution', async () => {
      const mockSdk = createMockSdk();

      await runChatAgent({
        chatId: 'test-id',
        messageId: 'msg-id',
        workingDirectory: '/test',
        prompt: 'Hello',
        messages: []
      }, {}, mockSdk);

      expect(mockSdk.messages.create).toHaveBeenCalledWith(
        'test-id',
        'msg-id',
        { prompt: 'Hello' }
      );
    });

    it('should update raw messages during agent execution', async () => {
      // Mock stream with message updates
      // Assert SDK update called with rawLlmMessages
    });

    it('should mark message as completed when agent finishes', async () => {
      // Mock successful agent execution
      // Assert SDK update called with isCompleted: true
    });

    it('should handle API failures gracefully', async () => {
      // Mock SDK create to fail
      // Assert continues execution (logs warning)
      // Assert still attempts local save as backup
    });

    it('should NOT save to local files', async () => {
      // Mock all SDK calls
      // Assert saveModelMessages NOT called
    });
  });
  ```

**Implementation:**
- Modify `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/services/chat-service.ts`
- Remove `saveModelMessages` import and calls
- Add SDK parameter (with default from factory)
- Remove file system operations
- Keep stream handler logic unchanged

**Type Safety:**
- Update `ChatServiceParams` schema to require SDK
- Validate all API responses with Zod

**Composability:**
- Pass SDK as dependency injection parameter
- Return Result type for better error handling
- Keep callbacks pure (no side effects in callbacks)

**Files to modify:**
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/services/chat-service.ts`
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/services/chat-service.test.ts`

**Dependencies:** Task 1.2, Task 1.3

---

#### Task 2.2: Refactor Headless Service with ChatId/MessageId Flags

**TEST FIRST:**
- **File**: `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/services/headless-service.test.ts` (modify existing)
- **Test cases**:
  ```typescript
  describe('runHeadlessAgent - API-first', () => {
    it('should create new chat when no chatId provided', async () => {
      const mockSdk = createMockSdk();

      const result = await runHeadlessAgent({
        prompt: 'Test',
      }, mockSdk);

      expect(mockSdk.messages.create).toHaveBeenCalledWith(
        expect.any(String), // generated chatId
        expect.any(String), // generated messageId
        { prompt: 'Test' }
      );
      expect(result.chatId).toBeDefined();
    });

    it('should resume existing chat when chatId provided', async () => {
      mockSdk.messages.getRawMessages.mockResolvedValue({
        success: true,
        chatId: 'existing-id',
        rawLlmMessages: [{ role: 'user', content: 'Previous' }]
      });

      await runHeadlessAgent({
        prompt: 'Continue',
        chatId: 'existing-id'
      }, mockSdk);

      expect(mockSdk.messages.getRawMessages).toHaveBeenCalledWith('existing-id');
      expect(mockSdk.messages.create).toHaveBeenCalledWith(
        'existing-id',
        expect.any(String),
        { prompt: 'Continue' }
      );
    });

    it('should overwrite message when messageId provided', async () => {
      await runHeadlessAgent({
        prompt: 'Updated',
        chatId: 'chat-id',
        messageId: 'msg-id'
      }, mockSdk);

      // When messageId provided, we're updating/overwriting
      expect(mockSdk.messages.update).toHaveBeenCalledWith(
        'chat-id',
        'msg-id',
        expect.objectContaining({ rawLlmMessages: expect.any(Array) })
      );
    });

    it('should NOT save to local files', async () => {
      // Assert saveModelMessages never called
    });
  });
  ```

**Implementation:**
- Modify `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/services/headless-service.ts`
- Add SDK parameter
- Remove `saveModelMessages` and `loadConversation` file operations
- Use `loadConversationFromApi` instead
- Support chatId and messageId flags properly

**Type Safety:**
- Update `HeadlessServiceParamsSchema` with SDK
- Validate all inputs with Zod

**Composability:**
- Pure function with explicit dependencies
- Return chatId and messageId for caller
- No global state

**Files to modify:**
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/services/headless-service.ts`
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/services/headless-service.test.ts`

**Dependencies:** Task 2.1

---

#### Task 2.3: Add ChatId/MessageId CLI Flags to Headless Command

**TEST FIRST:**
- **File**: `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/commands/main/main.int.test.ts` (integration test)
- **Test cases**:
  ```typescript
  describe('headless mode flags', () => {
    it('should accept --chat-id flag', async () => {
      // Execute CLI with --chat-id flag
      // Assert uses provided chatId
    });

    it('should accept --message-id flag', async () => {
      // Execute CLI with --message-id flag
      // Assert uses provided messageId
    });

    it('should accept both flags together', async () => {
      // Execute with both flags
      // Assert updates existing message
    });

    it('should validate UUID format', async () => {
      // Execute with invalid UUID
      // Assert shows helpful error message
    });
  });
  ```

**Implementation:**
- Find headless command definition (likely in main CLI entry point)
- Add `--chat-id <uuid>` flag
- Add `--message-id <uuid>` flag
- Pass to `runHeadlessAgent`

**Type Safety:**
- Validate UUID format with Zod
- Show clear error messages for invalid inputs

**Composability:**
- Parse flags at CLI layer
- Pass validated params to service layer

**Files to modify:**
- Look for CLI argument parser (Commander.js or similar)
- Update headless command handler

**Dependencies:** Task 2.2

---

### Phase 3: UI Component Updates

#### Task 3.1: Refactor Main Interactive Component

**TEST FIRST:**
- **File**: `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/commands/main/main.test.tsx`
- **Test cases**:
  ```typescript
  describe('Main component - API-first', () => {
    it('should initialize session without API call', () => {
      // Render component
      // Assert no SDK calls on mount
      // Assert chatId generated locally
    });

    it('should create message in API on first send', async () => {
      const mockSdk = createMockSdk();

      // Render with mocked SDK
      // Submit first message

      expect(mockSdk.messages.create).toHaveBeenCalledOnce();
    });

    it('should load conversation from API on subsequent sends', async () => {
      mockSdk.messages.getRawMessages.mockResolvedValue({
        success: true,
        chatId: 'test-id',
        rawLlmMessages: []
      });

      // Submit second message

      expect(mockSdk.messages.getRawMessages).toHaveBeenCalled();
    });

    it('should handle API errors with user-friendly messages', async () => {
      mockSdk.messages.create.mockRejectedValue(new Error('Network error'));

      // Submit message
      // Assert error displayed in UI
    });
  });
  ```

**Implementation:**
- Modify `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/commands/main/main.tsx`
- Remove `saveModelMessages` import
- Remove `loadConversation` from file system
- Use `loadConversationFromApi` before each message send
- Handle offline mode with clear error messages

**Type Safety:**
- Type all API interactions properly
- Use Zod schemas for validation

**Composability:**
- Keep component pure (React best practices)
- Pass SDK via context or props
- Separate API logic from rendering logic

**Files to modify:**
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/commands/main/main.tsx`

**Dependencies:** Task 2.1

---

#### Task 3.2: Refactor History Browser to Use API

**TEST FIRST:**
- **File**: `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/components/forms/history-browser.test.tsx`
- **Test cases**:
  ```typescript
  describe('HistoryBrowser - API-first', () => {
    it('should fetch conversation list from API', async () => {
      mockSdk.chats.list.mockResolvedValue({
        items: [
          { id: 'chat-1', title: 'Test Chat', updated_at: '2025-01-01' }
        ],
        total: 1,
        page: 0,
        pageSize: 50,
        hasMore: false
      });

      // Render component
      // Assert displays conversation from API
    });

    it('should load selected conversation from API', async () => {
      // Select conversation from list
      // Assert calls getRawMessages
      // Assert passes conversation to onSelect callback
    });

    it('should show loading state while fetching', () => {
      // Render with pending promise
      // Assert shows loading indicator
    });

    it('should show error state on API failure', async () => {
      mockSdk.chats.list.mockRejectedValue(new Error('API error'));

      // Assert shows error message
      // Assert provides retry option
    });

    it('should NOT read from local files', async () => {
      // Assert no file system operations
    });
  });
  ```

**Implementation:**
- Modify `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/components/forms/history-browser.tsx`
- Replace `listConversations` with API call
- Replace `loadConversation` with API call
- Add loading and error states
- Remove workingDirectory dependency (API is not dir-specific)

**Type Safety:**
- Use ChatListItem type from server-shared
- Validate API responses

**Composability:**
- Accept SDK via props or context
- Pure component with external data fetching
- Clear separation of data and presentation

**Files to modify:**
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/components/forms/history-browser.tsx`

**Dependencies:** Task 1.1, Task 1.2

---

#### Task 3.3: Simplify Session Management

**TEST FIRST:**
- **File**: `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/session.test.ts`
- **Test cases**:
  ```typescript
  describe('session management - simplified', () => {
    it('should initialize new session with UUID', () => {
      const chatId = initNewSession();

      expect(chatId).toMatch(/^[0-9a-f-]{36}$/);
      expect(getCurrentChatId()).toBe(chatId);
    });

    it('should set session chatId', () => {
      setSessionChatId('test-id');

      expect(getCurrentChatId()).toBe('test-id');
    });

    it('should NOT load from file system', () => {
      // Assert no file operations
    });

    it('should NOT depend on working directory', () => {
      // Session state is purely in-memory
      // Assert working directory not used
    });
  });
  ```

**Implementation:**
- Modify `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/session.ts`
- Remove `initOrResumeSession` (no file system lookups)
- Remove `getLatestConversation` dependency
- Keep simple in-memory state:
  - `initNewSession()` - generate UUID
  - `getCurrentChatId()` - return current chatId
  - `setSessionChatId(id)` - set chatId (for resume)

**Type Safety:**
- Simple string state
- UUID validation if needed

**Composability:**
- Pure getter/setter functions
- No side effects
- No dependencies

**Files to modify:**
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/session.ts`
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/session.test.ts`

**Dependencies:** None

---

### Phase 4: Migration & Cleanup

#### Task 4.1: Create Local File Migration Utility (Optional)

**TEST FIRST:**
- **File**: `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/migrate-local-conversations.test.ts`
- **Test cases**:
  ```typescript
  describe('migrateLocalConversations', () => {
    it('should upload local conversations to API', async () => {
      // Mock local file with conversations
      // Mock SDK create calls
      // Assert all conversations uploaded
    });

    it('should skip already-migrated conversations', async () => {
      // Mock conversation already in API
      // Assert skips upload
    });

    it('should handle partial failures gracefully', async () => {
      // Mock some uploads fail
      // Assert continues with remaining
      // Assert reports failures
    });

    it('should preserve conversation metadata', async () => {
      // Assert timestamps, message order preserved
    });
  });
  ```

**Implementation:**
- Create `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/migrate-local-conversations.ts`
- Read local conversation files
- Upload each to API via SDK
- Mark as migrated (rename or move file)
- Provide progress feedback

**Type Safety:**
- Use existing Conversation type
- Validate before upload

**Composability:**
- Pure function with SDK dependency
- Return migration results (success/failure counts)
- Idempotent (safe to run multiple times)

**Files to create:**
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/migrate-local-conversations.ts`
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/migrate-local-conversations.test.ts`

**Dependencies:** Task 1.2

**Note:** This task is OPTIONAL. Consider if migration is necessary or if we just deprecate local files.

---

#### Task 4.2: Deprecate Local File Storage

**TEST FIRST:**
- **File**: `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/conversation-history.test.ts`
- **Test cases**:
  ```typescript
  describe('conversation-history - deprecated', () => {
    it('should log deprecation warning when used', async () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      await saveModelMessages('test-id', '/test', []);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('deprecated')
      );
    });
  });
  ```

**Implementation:**
- Add deprecation warnings to all functions in `conversation-history.ts`
- Update documentation
- Keep functions working but logged as deprecated
- Plan removal timeline

**Type Safety:**
- No changes needed

**Composability:**
- Add deprecation metadata

**Files to modify:**
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/conversation-history.ts`

**Dependencies:** All Phase 3 tasks

---

#### Task 4.3: Remove Local File Dependencies (Final Cleanup)

**TEST FIRST:**
- Integration tests to verify CLI works without local files
- **File**: `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/integration.test.ts`
- **Test cases**:
  ```typescript
  describe('CLI integration - no local files', () => {
    it('should complete full conversation flow via API only', async () => {
      // Start session
      // Send message
      // Resume session
      // Assert no files created
    });
  });
  ```

**Implementation:**
- Remove `conversation-history.ts` entirely
- Remove `load-conversation-from-api.ts` (no longer needed)
- Update all imports
- Remove file system dependencies from stream-handler

**Type Safety:**
- Remove Conversation type from local files
- Use API types only

**Composability:**
- Simplify architecture
- Reduce dependencies

**Files to delete:**
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/conversation-history.ts`
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/load-conversation-from-api.ts`

**Files to modify:**
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/handlers/stream-handler.ts` (remove saveMessages callback)

**Dependencies:** Task 4.2

---

## API Endpoints

### Existing Endpoints (Already in SDK)

1. **Create Message** (upserts chat + message)
   - `POST /public/chats/:chatId/messages/:messageId`
   - Body: `{ prompt: string }`
   - Creates chat if doesn't exist
   - Creates message record

2. **Update Message** (update raw LLM messages)
   - `PUT /public/chats/:chatId/messages/:messageId`
   - Body: `{ rawLlmMessages?: unknown, isCompleted?: boolean }`
   - Updates existing message

3. **Get Raw Messages** (fetch conversation)
   - `GET /public/chats/:chatId/messages`
   - Returns: `{ success: boolean, chatId: string, rawLlmMessages: unknown }`

### New Endpoints Needed

4. **List Chats** (for history browser)
   - `GET /public/chats`
   - Query: `{ page_token?: number, page_size?: number }`
   - Returns: `ChatListItem[]`
   - **Status**: Endpoint exists, needs SDK method (Task 1.1)

### Future Enhancements (Not in Scope)

- Delete chat endpoint
- Search chats endpoint
- Share chat endpoint (already exists for web)

## Edge Cases

### Network Errors

**Scenario:** API is unavailable during message send

**Handling:**
```typescript
try {
  await sdk.messages.create(chatId, messageId, { prompt });
} catch (error) {
  // Show user-friendly error
  console.error('Unable to save conversation. Please check your internet connection.');

  // Optional: Save to local backup file
  // await saveToLocalBackup(chatId, messages);

  // Prevent agent execution (fail fast)
  throw new Error('API unavailable. Cannot proceed without saving conversation.');
}
```

**Test:**
```typescript
it('should fail gracefully when API unavailable', async () => {
  mockSdk.messages.create.mockRejectedValue(new Error('Network error'));

  await expect(runChatAgent({ ... })).rejects.toThrow('API unavailable');
});
```

### Offline Mode

**Decision:** Do NOT support offline mode in API-first refactor

**Rationale:**
- Adds complexity with sync logic
- Local files were the old "offline mode" - we're removing that
- Better UX: clear error messages vs. silent local-only mode
- Future: could add explicit offline mode with clear sync when online

**User Experience:**
```
❌ Unable to connect to Buster API

Please check your internet connection and try again.

If you need to work offline, use the --local flag (coming soon).
```

### Resuming Conversations

**Scenario:** User resumes conversation from different machine

**Handling:**
- History browser fetches from API (works across devices)
- Resume loads conversation via `getRawMessages`
- No file system dependency

**Test:**
```typescript
it('should resume conversation from any machine', async () => {
  // Mock API with conversation
  mockSdk.messages.getRawMessages.mockResolvedValue({
    success: true,
    chatId: 'chat-id',
    rawLlmMessages: [/* messages */]
  });

  // Load conversation
  const conv = await loadConversationFromApi('chat-id', mockSdk);

  // Assert loaded correctly
  expect(conv.modelMessages).toHaveLength(3);
});
```

### Conversation Not Found

**Scenario:** User provides chatId that doesn't exist in API

**Handling:**
```typescript
const conv = await loadConversationFromApi(chatId, sdk);

if (!conv) {
  console.error(`Conversation ${chatId} not found.`);
  console.log('Starting new conversation instead...');

  // Fall back to new conversation
  return initNewSession();
}
```

**Test:**
```typescript
it('should handle missing conversation gracefully', async () => {
  mockSdk.messages.getRawMessages.mockResolvedValue({
    success: false,
    error: 'Not found'
  });

  const result = await loadConversationFromApi('missing-id', mockSdk);

  expect(result).toBeNull();
});
```

### Message ID Conflicts

**Scenario:** User provides messageId that already exists

**Handling:**
- Update endpoint should overwrite (idempotent)
- If using create endpoint, should handle gracefully

**Test:**
```typescript
it('should handle duplicate messageId by updating', async () => {
  // First create
  await sdk.messages.create('chat-id', 'msg-id', { prompt: 'Test' });

  // Second create with same ID
  await sdk.messages.create('chat-id', 'msg-id', { prompt: 'Updated' });

  // Should update, not fail
  expect(mockApi.update).toHaveBeenCalled();
});
```

### Working Directory Handling

**Scenario:** Conversations previously scoped to working directory

**Handling:**
- API conversations are NOT scoped to working directory
- Working directory only relevant for file operations (tools, reading files)
- History browser shows ALL conversations for the user
- Optional: Add filtering by working directory in UI (not required)

**Migration:**
- Existing local files ARE scoped to working directory
- Migration utility preserves this in API (optional metadata)

## Testing Strategy

### Unit Tests (`*.test.ts`)

**What to test:**
- Pure functions (no I/O)
- Zod schema validation
- Data transformations
- Error handling logic

**Mocking:**
- Mock SDK entirely
- Mock credentials utility
- No real network calls

**Example:**
```typescript
describe('loadConversationFromApi', () => {
  it('should transform API response to Conversation type', async () => {
    const mockSdk = {
      messages: {
        getRawMessages: jest.fn().mockResolvedValue({
          success: true,
          chatId: 'test-id',
          rawLlmMessages: [{ role: 'user', content: 'Hi' }]
        })
      }
    };

    const result = await loadConversationFromApi('test-id', mockSdk);

    expect(result).toEqual({
      chatId: 'test-id',
      modelMessages: [{ role: 'user', content: 'Hi' }]
    });
  });
});
```

### Integration Tests (`*.int.test.ts`)

**What to test:**
- Full SDK interactions
- Error scenarios (network failures, 404s, etc.)
- End-to-end flows

**Mocking:**
- Use real SDK with test API server
- Or use nock/MSW to mock HTTP layer
- Real Zod validation

**Example:**
```typescript
describe('chat service integration', () => {
  it('should create and update message via real SDK', async () => {
    // Use test API server
    const sdk = createBusterSDK({
      apiKey: 'test-key',
      apiUrl: 'http://localhost:8080'
    });

    // Run full flow
    await runChatAgent({
      chatId: 'test-id',
      messageId: 'msg-id',
      prompt: 'Test',
      messages: []
    }, {}, sdk);

    // Verify API was called correctly
    const conv = await sdk.messages.getRawMessages('test-id');
    expect(conv.rawLlmMessages).toBeDefined();
  });
});
```

### React Component Tests

**What to test:**
- Component rendering
- User interactions
- API loading states
- Error states

**Tools:**
- Ink testing utilities
- Jest
- Mock SDK

**Example:**
```typescript
describe('HistoryBrowser component', () => {
  it('should render conversation list from API', async () => {
    const mockSdk = {
      chats: {
        list: jest.fn().mockResolvedValue({
          items: [
            { id: 'chat-1', title: 'Test', updated_at: '2025-01-01' }
          ],
          total: 1
        })
      }
    };

    const { lastFrame } = render(
      <HistoryBrowser sdk={mockSdk} onSelect={jest.fn()} onCancel={jest.fn()} />
    );

    // Wait for async load
    await waitFor(() => {
      expect(lastFrame()).toContain('Test');
    });
  });
});
```

### E2E Tests

**What to test:**
- Full CLI workflows
- Headless mode with flags
- Interactive mode with multiple messages

**Tools:**
- Spawn CLI process
- Mock API server
- Verify stdout/stderr

**Example:**
```bash
# Test headless mode
buster --prompt "Hello" --chat-id "existing-id"

# Verify output contains response
# Verify API was called correctly
```

## Migration Path

### Phase 0: Pre-Refactor (Current State)
- Local files are primary source of truth
- API is optional sync target
- Users may have conversations only in local files

### Phase 1: Dual Mode (Transition)
- Add API-first code paths
- Keep local file fallback
- History browser shows both sources
- New conversations go to API
- Old conversations still readable from files

**Timeline:** 1-2 weeks of development

### Phase 2: API Priority (Soft Deprecation)
- API is primary source
- Local files read-only (for old conversations)
- Show deprecation warnings for local-only conversations
- Provide migration tool

**Timeline:** 2 weeks after Phase 1

### Phase 3: API Only (Hard Deprecation)
- Remove local file reading entirely
- Migration tool required for old conversations
- Clear error messages if local files detected

**Timeline:** 4 weeks after Phase 2

### Phase 4: Cleanup (Final)
- Delete all local file code
- Simplify architecture
- Update documentation

**Timeline:** 2 weeks after Phase 3

## Success Criteria

### Functional Requirements
- ✅ All conversations stored in API
- ✅ No new local files created
- ✅ History browser fetches from API
- ✅ Resume works from any machine
- ✅ Headless mode supports chatId/messageId flags
- ✅ Error handling for offline scenarios

### Code Quality Requirements
- ✅ All new code has tests (>80% coverage)
- ✅ All Zod schemas have validation tests
- ✅ All API interactions have integration tests
- ✅ No deprecated code remains
- ✅ TypeScript strict mode passes
- ✅ Turbo build/lint/test all pass

### Performance Requirements
- ✅ History browser loads in <2 seconds
- ✅ Message send latency <500ms (excluding agent execution)
- ✅ No unnecessary API calls (proper caching)

### UX Requirements
- ✅ Clear error messages for network failures
- ✅ Loading states for all async operations
- ✅ No breaking changes for existing users (during transition)
- ✅ Migration path documented

## Rollout Plan

### Week 1-2: Foundation
- Complete Phase 1 tasks (SDK enhancements)
- Set up testing infrastructure
- Write comprehensive tests

### Week 3-4: Core Refactoring
- Complete Phase 2 tasks (services)
- Update main command flows
- Maintain backward compatibility

### Week 5-6: UI Updates
- Complete Phase 3 tasks (components)
- Polish user experience
- Add error handling

### Week 7: Testing & Migration
- Complete Phase 4 tasks (cleanup)
- Run full test suite
- Test migration path

### Week 8: Rollout
- Deploy to staging
- Gradual rollout to users
- Monitor for issues

## Open Questions

1. **Should we support offline mode at all?**
   - Decision: No, fail fast with clear errors

2. **How to handle working directory in API?**
   - Decision: Store as metadata, but don't scope conversations by it

3. **Migration strategy for existing users?**
   - Decision: Provide optional migration tool, but not required

4. **Should history browser filter by working directory?**
   - Decision: Show all conversations, add optional filter later

5. **Rate limiting on API calls?**
   - Decision: Implement client-side throttling if needed

6. **Caching strategy for conversation list?**
   - Decision: Simple in-memory cache with TTL

## Appendix: File Inventory

### Files to Modify
- `/Users/dallin/worktrees/finish-up-tui/packages/sdk/src/lib/client/buster-sdk.ts`
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/services/chat-service.ts`
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/services/headless-service.ts`
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/commands/main/main.tsx`
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/components/forms/history-browser.tsx`
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/session.ts`
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/handlers/stream-handler.ts`

### Files to Create
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/api-conversation.ts`
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/sdk-factory.ts`
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/migrate-local-conversations.ts` (optional)
- All corresponding test files

### Files to Delete (Phase 4)
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/conversation-history.ts`
- `/Users/dallin/worktrees/finish-up-tui/apps/cli/src/utils/load-conversation-from-api.ts`

## Conclusion

This refactoring transforms the CLI from a complex dual-source-of-truth architecture to a clean API-first approach. By following TDD principles and breaking the work into manageable phases, we can deliver this change safely while maintaining user experience.

**Key Takeaways:**
- API is the single source of truth
- All code is test-driven (tests written FIRST)
- Pure functions with explicit dependencies
- Clear error handling for offline scenarios
- Phased rollout minimizes risk
- Comprehensive testing ensures reliability

**Next Steps:**
1. Review and approve this document
2. Begin Phase 1, Task 1.1 (write tests FIRST)
3. Follow TDD cycle for each task
4. Regular check-ins on progress
5. Adjust timeline as needed

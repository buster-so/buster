# CLAUDE.md - CLI Application

This file provides guidance for working with the Buster CLI application built with TypeScript, Commander, and Ink.

## Core Principles

### Type Safety First - Zod Everything
- **Zod schemas are the source of truth** - Define ALL data structures as Zod schemas first
- **Export types from schemas** - Always use `z.infer<typeof Schema>` for TypeScript types
- **Runtime validation everywhere** - Use `.parse()` for trusted data, `.safeParse()` for user input
- **No implicit any** - Every variable, parameter, and return type must be explicitly typed
- **Validate at boundaries** - All user input, API responses, and file reads must be validated

### Functional Programming - No Classes
- **Pure functions only** - Commands are functions that accept input and return output
- **Composable modules** - Build features by composing small, focused functions
- **Immutable data** - Never mutate; always create new data structures
- **Pattern from analyst-agent** - Follow the structure in `@packages/ai/src/agents/analyst-agent/analyst-agent.ts`
- **Avoid OOP** - No classes, no inheritance, no `this` keyword

### Module Organization
- **Small files** - Each file should have a single, clear responsibility
- **Colocate tests** - Keep `.test.ts` (unit) and `.int.test.ts` (integration) next to implementation
- **Explicit exports** - Use named exports and create comprehensive index.ts files
- **Deep nesting is OK** - Organize into logical subdirectories for clarity

## Project Structure

```
apps/cli/
├── src/
│   ├── commands/                  # CLI command implementations
│   │   ├── auth/                 # Authentication commands
│   │   │   ├── login.tsx         # Login command UI
│   │   │   ├── login.test.tsx    # Unit tests
│   │   │   ├── login-handler.ts  # Pure function logic
│   │   │   ├── logout.tsx        # Logout command
│   │   │   └── index.ts          # Exports
│   │   ├── chat/                 # Interactive AI chat
│   │   │   ├── chat.tsx          # Chat UI component
│   │   │   ├── chat-handler.ts   # Chat logic
│   │   │   ├── chat-state.ts     # State management
│   │   │   └── chat.test.tsx     # Tests
│   │   ├── run/                  # Run SQL queries
│   │   │   ├── run-query.tsx     # Query execution UI
│   │   │   ├── run-handler.ts    # Query logic
│   │   │   └── run.test.ts       # Tests
│   │   └── index.ts              # Command registry
│   ├── components/               # Reusable Ink UI components
│   │   ├── error-boundary.tsx   # Error display component
│   │   ├── spinner.tsx          # Loading spinner
│   │   ├── table.tsx            # Data table display
│   │   └── index.ts
│   ├── utils/                   # Shared utilities
│   │   ├── config/              # Configuration management
│   │   │   ├── config-manager.ts
│   │   │   ├── config-schema.ts # Zod schemas for config
│   │   │   └── config-paths.ts  # ~/.buster paths
│   │   ├── sdk/                 # Buster SDK wrapper
│   │   │   ├── create-client.ts
│   │   │   └── client-types.ts
│   │   ├── validation/          # Shared Zod schemas
│   │   │   ├── common.ts
│   │   │   └── index.ts
│   │   └── errors/              # Error handling
│   │       ├── format-error.ts
│   │       └── error-types.ts
│   └── index.tsx                # CLI entry point
```

## Command Implementation Pattern

Every command follows this functional pattern inspired by the analyst-agent:

```typescript
// commands/auth/login.ts
import { z } from 'zod';

// 1. Define Zod schema for ALL inputs
export const LoginOptionsSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  host: z.string().url().default('https://api.buster.so'),
  cloud: z.boolean().default(false),
  local: z.boolean().default(false),
});

export type LoginOptions = z.infer<typeof LoginOptionsSchema>;

// 2. Pure handler function - no side effects, just business logic
export async function loginHandler(
  options: LoginOptions,
  configManager: ConfigManager
): Promise<{ success: boolean; message: string }> {
  // Validate credentials
  const validated = LoginOptionsSchema.parse(options);
  
  // Determine host
  const host = validated.cloud ? 'https://api.buster.so' : 
                validated.local ? 'http://localhost:8000' : 
                validated.host;
  
  // Save credentials
  await configManager.saveCredentials({
    apiKey: validated.apiKey,
    apiUrl: host,
  });
  
  return {
    success: true,
    message: `Successfully authenticated to ${host}`,
  };
}

// 3. Ink component for UI (if interactive)
// commands/auth/login-ui.tsx
import React, { useState } from 'react';
import { Text, Box, TextInput } from 'ink';
import { useAuth } from './use-auth';

export function LoginUI() {
  const [apiKey, setApiKey] = useState('');
  const { login, status, error } = useAuth();
  
  const handleSubmit = () => {
    login({ apiKey });
  };
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  if (status === 'success') {
    return (
      <Box>
        <Text color="green">✓ Successfully logged in to Buster</Text>
      </Box>
    );
  }
  
  return (
    <Box flexDirection="column">
      <Text>Enter your Buster API key:</Text>
      <TextInput
        value={apiKey}
        onChange={setApiKey}
        onSubmit={handleSubmit}
        mask="*"
      />
    </Box>
  );
}

// 4. Commander integration
// commands/auth/index.ts
import { Command } from 'commander';
import { render } from 'ink';
import { LoginOptionsSchema, loginHandler } from './login';
import { LoginUI } from './login-ui';
import { handleCommandError } from '../../utils/errors';

export function registerAuthCommands(program: Command) {
  const auth = program
    .command('auth')
    .description('Authentication commands');
  
  auth
    .command('login')
    .description('Authenticate with Buster')
    .option('-k, --api-key <key>', 'API key')
    .option('--host <url>', 'API host URL')
    .option('--cloud', 'Use cloud instance')
    .option('--local', 'Use local instance')
    .action(async (options) => {
      try {
        if (!options.apiKey && process.stdout.isTTY) {
          // Interactive mode
          render(<LoginUI />);
        } else {
          // Non-interactive mode
          const validated = LoginOptionsSchema.parse(options);
          const configManager = createConfigManager();
          const result = await loginHandler(validated, configManager);
          console.info(result.message);
        }
      } catch (error) {
        handleCommandError(error);
      }
    });
}
```

## Real CLI Command Examples

### Chat Command
```typescript
// commands/chat/chat-handler.ts
import { z } from 'zod';
import type { ChatMessage, ChatResponse } from '@buster/server-shared/chats';

export const ChatOptionsSchema = z.object({
  message: z.string().optional(),
  dataSourceId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  stream: z.boolean().default(true),
});

export type ChatOptions = z.infer<typeof ChatOptionsSchema>;

export async function chatHandler(
  message: string,
  options: ChatOptions,
  sdk: BusterSDK
): Promise<ChatResponse> {
  return sdk.chat.send({
    message,
    dataSourceId: options.dataSourceId,
    conversationId: options.conversationId,
  });
}

// commands/chat/chat-state.ts
import { z } from 'zod';

const ChatStateSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  currentInput: z.string(),
  isStreaming: z.boolean(),
  error: z.string().optional(),
});

type ChatState = z.infer<typeof ChatStateSchema>;

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_INPUT':
      return { ...state, currentInput: action.payload };
    case 'SET_STREAMING':
      return { ...state, isStreaming: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}
```

### Run Query Command
```typescript
// commands/run/run-query.ts
import { z } from 'zod';

export const RunQueryOptionsSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  dataSourceId: z.string().uuid('Invalid data source ID'),
  limit: z.number().min(1).max(5000).default(100),
  format: z.enum(['json', 'table', 'csv']).default('table'),
  output: z.string().optional(), // Output file path
});

export type RunQueryOptions = z.infer<typeof RunQueryOptionsSchema>;

export async function runQueryHandler(
  options: RunQueryOptions,
  sdk: BusterSDK
): Promise<{ rows: any[]; executionTime: number }> {
  const startTime = Date.now();
  
  const result = await sdk.dataSources.executeQuery({
    query: options.query,
    dataSourceId: options.dataSourceId,
    limit: options.limit,
  });
  
  return {
    rows: result.rows,
    executionTime: Date.now() - startTime,
  };
}

// commands/run/format-output.ts
export function formatQueryOutput(
  data: any[],
  format: 'json' | 'table' | 'csv'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'csv':
      return convertToCSV(data);
    case 'table':
      return convertToTable(data);
  }
}
```

## State Management for Interactive Commands

### React Hooks Pattern (Preferred for Simple State)
```typescript
// hooks/use-chat.ts
import { useState, useCallback } from 'react';
import { createSDKClient } from '../utils/sdk';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const sendMessage = useCallback(async (text: string) => {
    setIsLoading(true);
    try {
      const sdk = await createSDKClient();
      const response = await sdk.chat.send({ message: text });
      setMessages(prev => [...prev, 
        { role: 'user', content: text },
        { role: 'assistant', content: response.content }
      ]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return { messages, sendMessage, isLoading };
}
```

### Complex State with useReducer (For Multi-step Flows)
```typescript
// commands/init/init-state.ts
import { z } from 'zod';

const InitStateSchema = z.object({
  step: z.enum(['select-datasource', 'configure', 'test', 'complete']),
  dataSourceType: z.string().optional(),
  credentials: z.record(z.string()).optional(),
  testResult: z.object({
    success: z.boolean(),
    message: z.string(),
  }).optional(),
});

type InitState = z.infer<typeof InitStateSchema>;

export function initReducer(state: InitState, action: InitAction): InitState {
  switch (action.type) {
    case 'SELECT_DATASOURCE':
      return { ...state, dataSourceType: action.payload, step: 'configure' };
    case 'SET_CREDENTIALS':
      return { ...state, credentials: action.payload, step: 'test' };
    case 'TEST_COMPLETE':
      return { ...state, testResult: action.payload, step: 'complete' };
    default:
      return state;
  }
}
```

## Configuration Management

### Configuration Location
Follow the legacy CLI pattern - all config stored in `~/.buster/`:

```typescript
// utils/config/config-paths.ts
import { homedir } from 'node:os';
import { join } from 'node:path';

export const CONFIG_BASE_DIR = join(homedir(), '.buster');
export const CREDENTIALS_PATH = join(CONFIG_BASE_DIR, 'credentials.yml');
export const CONFIG_PATH = join(CONFIG_BASE_DIR, 'config.json');
export const CACHE_DIR = join(CONFIG_BASE_DIR, 'cache');

// Legacy compatibility paths
export const OPENAI_KEY_PATH = join(CONFIG_BASE_DIR, '.openai_api_key');
export const RERANKER_CONFIG_PATH = join(CONFIG_BASE_DIR, '.reranker_provider');
```

### Configuration Schema
```typescript
// utils/config/config-schema.ts
import { z } from 'zod';

export const CredentialsSchema = z.object({
  apiKey: z.string().min(1),
  apiUrl: z.string().url().default('https://api.buster.so'),
  organizationId: z.string().uuid().optional(),
});

export const ConfigSchema = z.object({
  defaultDataSource: z.string().optional(),
  outputFormat: z.enum(['json', 'table', 'csv']).default('table'),
  colorOutput: z.boolean().default(true),
  telemetry: z.boolean().default(true),
});

// For buster.yml project config
export const ProjectConfigSchema = z.object({
  name: z.string(),
  datasources: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
  })),
  version: z.string().default('1.0'),
});
```

## Error Handling

### Comprehensive Error Communication
Always provide clear, actionable error messages:

```typescript
// utils/errors/format-error.ts
import { ZodError } from 'zod';
import chalk from 'chalk';

export function formatError(error: unknown): string {
  // Zod validation errors
  if (error instanceof ZodError) {
    const issues = error.issues.map(issue => {
      const path = issue.path.join('.');
      return `  • ${path}: ${issue.message}`;
    }).join('\n');
    
    return chalk.red('Validation Error:\n') + issues;
  }
  
  // Authentication errors
  if (error instanceof Error && error.message.includes('401')) {
    return chalk.red('Authentication Error: ') +
           'Your API key is invalid or expired\n' +
           chalk.yellow('Run: ') + 'buster auth login';
  }
  
  // Connection errors
  if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
    return chalk.red('Connection Error: ') + 
           'Unable to connect to Buster API\n' +
           chalk.yellow('Try: ') + 
           '1. Check your internet connection\n' +
           '2. Verify API URL with: buster config get apiUrl\n' +
           '3. If using local, ensure server is running';
  }
  
  // Data source errors
  if (error instanceof Error && error.message.includes('data source')) {
    return chalk.red('Data Source Error: ') + error.message + '\n' +
           chalk.yellow('Try: ') + 'buster datasource list';
  }
  
  // Generic errors with suggestions
  if (error instanceof Error) {
    return chalk.red('Error: ') + error.message + '\n' +
           chalk.dim('For help, run: buster --help');
  }
  
  return chalk.red('Unknown error occurred\n') +
         chalk.dim('Enable debug mode with: export BUSTER_DEBUG=1');
}

// Exit codes following Unix conventions
export function exitWithError(error: unknown): never {
  console.error(formatError(error));
  
  if (error instanceof ZodError) {
    process.exit(2); // Misuse of shell command
  }
  
  if (error instanceof Error && error.message.includes('401')) {
    process.exit(77); // Permission denied
  }
  
  process.exit(1); // General error
}
```

## SDK Integration

### SDK Client Creation
```typescript
// utils/sdk/create-client.ts
import { BusterSDK } from '@buster/sdk';
import { loadCredentials } from '../config';
import { z } from 'zod';

const SDKOptionsSchema = z.object({
  apiKey: z.string(),
  apiUrl: z.string().url(),
  timeout: z.number().default(30000),
});

let cachedClient: BusterSDK | null = null;

export async function createSDKClient(): Promise<BusterSDK> {
  if (cachedClient) return cachedClient;
  
  const credentials = await loadCredentials();
  
  if (!credentials.apiKey) {
    throw new Error('Not authenticated. Run: buster auth login');
  }
  
  const options = SDKOptionsSchema.parse({
    apiKey: credentials.apiKey,
    apiUrl: credentials.apiUrl,
  });
  
  cachedClient = new BusterSDK(options);
  return cachedClient;
}
```

## Testing Strategy

### Unit Tests (.test.ts)
```typescript
// commands/run/run-query.test.ts
import { describe, it, expect, vi } from 'vitest';
import { runQueryHandler, RunQueryOptionsSchema } from './run-query';

describe('runQueryHandler', () => {
  it('should enforce row limit of 5000', () => {
    const result = RunQueryOptionsSchema.safeParse({
      query: 'SELECT * FROM users',
      dataSourceId: '550e8400-e29b-41d4-a716-446655440000',
      limit: 10000,
    });
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('5000');
    }
  });

  it('should execute query with SDK', async () => {
    const mockSDK = {
      dataSources: {
        executeQuery: vi.fn().mockResolvedValue({ 
          rows: [{ id: 1 }],
          rowCount: 1 
        })
      }
    };
    
    const options = RunQueryOptionsSchema.parse({
      query: 'SELECT * FROM users LIMIT 1',
      dataSourceId: '550e8400-e29b-41d4-a716-446655440000',
    });
    
    const result = await runQueryHandler(options, mockSDK as any);
    
    expect(result.rows).toHaveLength(1);
    expect(mockSDK.dataSources.executeQuery).toHaveBeenCalledWith({
      query: options.query,
      dataSourceId: options.dataSourceId,
      limit: 100, // default
    });
  });
});
```

### Integration Tests (.int.test.ts)
```typescript
// commands/auth/login.int.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';
import { LoginUI } from './login-ui';
import { rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Login Integration', () => {
  let testConfigDir: string;

  beforeEach(async () => {
    // Use temp directory for test config
    testConfigDir = join(tmpdir(), 'buster-cli-test');
    await mkdir(testConfigDir, { recursive: true });
    process.env.BUSTER_CONFIG_DIR = testConfigDir;
  });

  afterEach(async () => {
    await rm(testConfigDir, { recursive: true, force: true });
    delete process.env.BUSTER_CONFIG_DIR;
  });

  it('should save credentials after successful login', async () => {
    const { stdin, lastFrame } = render(<LoginUI />);
    
    // Enter API key
    stdin.write('test-api-key-123');
    stdin.write('\r'); // Enter
    
    // Wait for async operations
    await delay(100);
    
    expect(lastFrame()).toContain('Successfully logged in');
    
    // Verify credentials were saved
    const credPath = join(testConfigDir, 'credentials.yml');
    expect(existsSync(credPath)).toBe(true);
  });
});
```

## Development Workflow

### Type Safety Checks
```bash
# Always run during development
turbo run build:dry-run --filter=@buster-app/cli

# Full type check
turbo run typecheck --filter=@buster-app/cli
```

### Linting
```bash
# Auto-fix issues
turbo run lint --filter=@buster-app/cli
```

### Testing
```bash
# Unit tests (run frequently)
turbo run test:unit --filter=@buster-app/cli

# Integration tests (run before commit)
turbo run test:integration --filter=@buster-app/cli

# Watch mode during development
turbo run test:watch --filter=@buster-app/cli
```

## Best Practices Checklist

### Before Writing Code
- [ ] Define Zod schema for ALL data structures
- [ ] Check `@buster/server-shared` for existing types
- [ ] Plan module structure (small, focused files)
- [ ] Design pure, testable functions

### While Writing Code
- [ ] Export types using `z.infer<typeof Schema>`
- [ ] Validate all external input with `.parse()` or `.safeParse()`
- [ ] Keep functions pure and composable
- [ ] Write descriptive error messages with actionable suggestions
- [ ] Add unit tests alongside implementation

### Before Committing
- [ ] Run `turbo run build:dry-run --filter=@buster-app/cli`
- [ ] Run `turbo run lint --filter=@buster-app/cli`
- [ ] Run `turbo run test:unit --filter=@buster-app/cli`
- [ ] Ensure all errors have helpful messages and suggestions

## Anti-Patterns to Avoid

### Never Do This
- ❌ Using classes or OOP patterns
- ❌ Using `any` type
- ❌ Skipping Zod validation
- ❌ Duplicating types from server-shared
- ❌ Large files with multiple responsibilities
- ❌ Mutating state directly
- ❌ Generic error messages like "Error occurred"
- ❌ console.log (use console.info/warn/error)
- ❌ Untested command handlers
- ❌ Storing config outside ~/.buster
- ❌ Synchronous file operations (use node:fs/promises)
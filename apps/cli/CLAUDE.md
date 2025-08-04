# Buster CLI Development Guidelines

This document provides specific guidelines for developing the TypeScript-based Buster CLI in this monorepo.

## Architecture Overview

The Buster CLI is a **thin client** that serves as a gateway to the Buster server API. It handles:
- File system operations (reading/writing YAML files)
- API communication with the server
- Rich terminal UI using Ink (React for CLI)

**Important**: The CLI does NOT directly access databases or AI services. All business logic is handled by the server.

## Directory Structure

```
apps/cli/
├── src/
│   ├── commands/           # Command implementations
│   │   ├── auth/          # Each command in its own folder
│   │   │   ├── index.ts   # Command definition and setup
│   │   │   ├── types.ts   # Command-specific types (Zod schemas)
│   │   │   ├── helpers.ts # Command utilities
│   │   │   └── auth.test.ts
│   │   ├── init/
│   │   ├── deploy/
│   │   └── ...
│   ├── components/        # Reusable Ink UI components
│   │   ├── forms/        # Form components
│   │   ├── tables/       # Table display components
│   │   ├── progress/     # Progress indicators
│   │   ├── prompts/      # Input prompts
│   │   └── status/       # Status displays
│   ├── utils/            # Shared utilities
│   │   ├── api-client.ts # Server API communication
│   │   ├── config.ts     # Configuration management
│   │   ├── errors.ts     # Error handling
│   │   └── validation.ts # Zod validation utilities
│   ├── schemas/          # Zod schemas
│   │   ├── commands/     # Command argument schemas
│   │   ├── config/       # Configuration schemas
│   │   ├── models/       # Data model schemas
│   │   └── api/          # API request/response schemas
│   └── main.ts           # CLI entry point
├── scripts/
│   └── validate-env.ts   # Environment validation
└── tests/
    ├── unit/            # Unit tests
    ├── integration/     # Integration tests
    └── utils/           # Test utilities
```

## Command Development Pattern

Each command follows a consistent structure:

### 1. Command Definition (`index.ts`)

```typescript
import { Command } from 'commander';
import { z } from 'zod';
import React from 'react';
import { render } from 'ink';
import { AuthUI } from './components.js';
import { authHandler } from './handlers.js';
import { AuthArgsSchema } from './types.js';

export const authCommand = new Command('auth')
  .description('Authenticate with Buster')
  .option('-h, --host <host>', 'API host URL')
  .option('-k, --api-key <key>', 'API key')
  .action(async (options) => {
    // Validate arguments
    const args = AuthArgsSchema.parse(options);
    
    // Render Ink UI
    const { waitUntilExit } = render(
      <AuthUI args={args} onComplete={authHandler} />
    );
    
    await waitUntilExit();
  });
```

### 2. Type Definitions (`types.ts`)

```typescript
import { z } from 'zod';

// Command arguments schema
export const AuthArgsSchema = z.object({
  host: z.string().url().optional(),
  apiKey: z.string().optional(),
});

export type AuthArgs = z.infer<typeof AuthArgsSchema>;

// Internal types
export const CredentialsSchema = z.object({
  apiKey: z.string(),
  apiUrl: z.string().url(),
  environment: z.enum(['local', 'cloud']),
});

export type Credentials = z.infer<typeof CredentialsSchema>;
```

### 3. Ink UI Components (`components.tsx`)

```typescript
import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';

interface AuthUIProps {
  args: AuthArgs;
  onComplete: (credentials: Credentials) => Promise<void>;
}

export const AuthUI: React.FC<AuthUIProps> = ({ args, onComplete }) => {
  const [step, setStep] = useState<'input' | 'validating' | 'complete'>('input');
  const [apiKey, setApiKey] = useState(args.apiKey || '');
  
  // UI implementation with Ink components
  return (
    <Box flexDirection="column">
      {step === 'input' && (
        <Box>
          <Text>Enter your API key: </Text>
          <TextInput value={apiKey} onChange={setApiKey} />
        </Box>
      )}
      {step === 'validating' && (
        <Text>
          <Spinner type="dots" /> Validating credentials...
        </Text>
      )}
    </Box>
  );
};
```

### 4. Command Logic (`helpers.ts`)

```typescript
import { apiClient } from '../../utils/api-client.js';
import { configManager } from '../../utils/config.js';
import type { Credentials } from './types.js';

export async function validateCredentials(credentials: Credentials): Promise<boolean> {
  try {
    await apiClient.validateAuth(credentials);
    return true;
  } catch (error) {
    return false;
  }
}

export async function saveCredentials(credentials: Credentials): Promise<void> {
  await configManager.saveCredentials(credentials);
}
```

## Zod-First Type System

We use Zod schemas for all type definitions and runtime validation:

### 1. Define Schema First

```typescript
// Always define the schema first
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
});

// Then export the type
export type User = z.infer<typeof UserSchema>;
```

### 2. Validate User Input

```typescript
// In command actions
.action(async (options) => {
  const args = ArgsSchema.parse(options); // Throws if invalid
  // args is now fully typed and validated
});
```

### 3. YAML File Validation

```typescript
import yaml from 'js-yaml';
import { BusterConfigSchema } from '../schemas/config/buster-config.js';

export async function loadBusterConfig(path: string): Promise<BusterConfig> {
  const content = await fs.readFile(path, 'utf-8');
  const parsed = yaml.load(content);
  return BusterConfigSchema.parse(parsed); // Validates and types
}
```

## API Client Pattern

All server communication goes through the centralized API client:

```typescript
// utils/api-client.ts
import type { User } from '@buster/server-shared/users';
import { z } from 'zod';

export class ApiClient {
  constructor(private baseUrl: string, private apiKey?: string) {}
  
  async request<T>({
    method,
    path,
    body,
    responseSchema,
  }: {
    method: string;
    path: string;
    body?: unknown;
    responseSchema: z.ZodSchema<T>;
  }): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    
    const data = await response.json();
    return responseSchema.parse(data);
  }
}
```

## Ink UI Components Guidelines

### 1. Component Organization

- Place reusable components in `src/components/`
- Command-specific components stay in the command folder
- Export all components from index files

### 2. Common Patterns

```typescript
// Progress indicator
<Box>
  <Spinner type="dots" />
  <Text> {message}</Text>
</Box>

// Form with validation
<Box flexDirection="column">
  <TextInput
    value={value}
    onChange={setValue}
    placeholder="Enter value"
  />
  {error && <Text color="red">❌ {error}</Text>}
</Box>

// Status display
<Box borderStyle="round" padding={1}>
  <Text color="green">✓ Operation successful</Text>
</Box>
```

### 3. State Management

- Use React hooks for local state
- Pass callbacks for command completion
- Handle errors gracefully with try/catch

## Testing Strategy

### 1. Unit Tests

```typescript
// auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { validateCredentials } from './helpers.js';

describe('auth helpers', () => {
  it('should validate correct credentials', async () => {
    const mockApiClient = vi.mocked(apiClient);
    mockApiClient.validateAuth.mockResolvedValue(true);
    
    const result = await validateCredentials({
      apiKey: 'test-key',
      apiUrl: 'https://api.buster.com',
    });
    
    expect(result).toBe(true);
  });
});
```

### 2. Integration Tests

```typescript
// auth.int.test.ts
import { testCLI } from '../../tests/utils/cli-tester.js';

describe('auth command integration', () => {
  it('should authenticate with valid credentials', async () => {
    const result = await testCLI(['auth', '--api-key', 'test-key']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Successfully authenticated');
  });
});
```

### 3. Ink Component Tests

```typescript
import { render } from 'ink-testing-library';
import { AuthUI } from './components.js';

it('should render auth form', () => {
  const { lastFrame } = render(<AuthUI args={{}} onComplete={vi.fn()} />);
  expect(lastFrame()).toContain('Enter your API key:');
});
```

## Error Handling

### 1. Custom Error Classes

```typescript
export class CLIError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'CLIError';
  }
}

export class ApiError extends CLIError {
  constructor(public status: number, message: string) {
    super(message, 'API_ERROR');
  }
}

export class ValidationError extends CLIError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}
```

### 2. Error Display in Ink

```typescript
interface ErrorDisplayProps {
  error: Error;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => (
  <Box borderStyle="round" borderColor="red" padding={1}>
    <Text color="red">
      ❌ {error.message}
      {error instanceof CLIError && (
        <Text dimColor> (Code: {error.code})</Text>
      )}
    </Text>
  </Box>
);
```

## Configuration Management

### 1. File Locations

- Global config: `~/.buster/config.yml`
- Project config: `./buster.yml`
- Credentials: `~/.buster/credentials` (encrypted)

### 2. Schema Validation

```typescript
export const BusterConfigSchema = z.object({
  version: z.string(),
  projectName: z.string(),
  organization: z.string().optional(),
  settings: z.object({
    autoUpdate: z.boolean().default(true),
    telemetry: z.boolean().default(true),
  }).optional(),
});
```

## Best Practices

1. **Keep Commands Simple**: Commands should only handle argument parsing and UI rendering
2. **Delegate to Handlers**: Business logic goes in handler functions
3. **Use Zod Everywhere**: All user input and file parsing should use Zod validation
4. **Server-First**: All operations should go through the server API
5. **Rich UI Feedback**: Use Ink components to provide clear, beautiful feedback
6. **Handle Errors Gracefully**: Show helpful error messages with recovery suggestions
7. **Test Everything**: Unit test logic, integration test commands, component test UI

## Common Patterns

### Loading Configuration

```typescript
export async function loadProjectConfig(): Promise<BusterConfig | null> {
  try {
    const configPath = path.join(process.cwd(), 'buster.yml');
    const content = await fs.readFile(configPath, 'utf-8');
    const parsed = yaml.load(content);
    return BusterConfigSchema.parse(parsed);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // No config file
    }
    throw new ValidationError('Invalid buster.yml configuration');
  }
}
```

### API Request with Progress

```typescript
const { unmount } = render(
  <ProgressDisplay message="Deploying models..." />
);

try {
  const result = await apiClient.deployModels(models);
  unmount();
  
  render(<SuccessDisplay result={result} />);
} catch (error) {
  unmount();
  render(<ErrorDisplay error={error} />);
}
```

### Multi-Step Operations

```typescript
export const InitUI: React.FC = () => {
  const [step, setStep] = useState(0);
  const steps = ['Create folders', 'Generate config', 'Validate setup'];
  
  return (
    <Box flexDirection="column">
      <ProgressSteps steps={steps} currentStep={step} />
      {/* Step-specific UI */}
    </Box>
  );
};
```

## Environment Variables

- `BUSTER_API_URL`: Base URL for the Buster API
- `BUSTER_API_KEY`: API authentication key
- `BUSTER_CONFIG_DIR`: Override config directory location
- `BUSTER_CACHE_DIR`: Override cache directory location
- `BUSTER_AUTO_UPDATE`: Enable/disable auto-updates
- `BUSTER_TELEMETRY_DISABLED`: Disable telemetry

## Distribution

The CLI is distributed as:
1. npm package: `npm install -g @buster/cli`
2. Homebrew: `brew install buster-cli`
3. Direct binary: Download from GitHub releases

Binaries are compiled using Bun's compile feature for all major platforms.
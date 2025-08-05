# CLI Migration to TypeScript - Rich Ink UI Implementation Plan

## Implementation Status

### Completed Items ✅
- Project structure created at `/apps/cli/`
- TypeScript/build configuration (tsup, tsconfig.json, package.json)
- All command file structures created in `/apps/cli/src/commands/`
- ✅ COMPLETED: Hybrid component structure implemented with shared components in `/apps/cli/src/components/` and command-specific components in command folders
- Utils directory structure created (renamed from lib to utils)
- CLAUDE.md and README.md created
- Package.json with all dependencies configured
- Environment validation script created at `/apps/cli/scripts/validate-env.ts`

### Stubbed Items 🚧 (Structure exists, needs implementation)
- All command implementations (auth, init, deploy, parse, config, update, start/stop/reset)
- API client with basic structure at `/apps/cli/src/utils/api-client.ts`
- Configuration management at `/apps/cli/src/utils/config.ts`
- Error handling classes at `/apps/cli/src/utils/errors.ts`
- 🚧 STUBBED: Basic shared components (ErrorBox, SuccessBox, ProgressBar) in `/components/common/`
- 🚧 STUBBED: Command-specific component structure in all command folders (components.tsx files)
- 🚧 STUBBED: Shared component categories (forms, tables, progress, prompts, status)
- ✅ COMPLETED: Validation utilities at `/apps/cli/src/utils/validation.ts`
- ✅ COMPLETED: YAML utilities at `/apps/cli/src/utils/yaml.ts`
- Credential encryption at `/apps/cli/src/utils/credentials.ts`

### Pending Items ⏳ (Not yet started)
- Actual API integration and server communication
- Complete YAML validation schemas implementation
- Full credential encryption system
- Docker integration for service management
- Auto-update functionality with GitHub releases
- Comprehensive test suites and coverage
- Binary compilation with Bun
- Cross-platform distribution

### Changes Made During Stubbing
- **Removed generate command**: Server handles semantic model generation via introspection
- **Removed chat command**: Not needed for CLI functionality
- **Renamed lib to utils directory**: Better alignment with CLI patterns
- **Confirmed Ink/React for all UI**: All user interface components use Ink framework
- **Simplified scope**: Focus on file system operations and API client functionality
- **✅ COMPLETED: Hybrid component structure implemented**: Command-specific components stay local, shared components in `/components/`
- **✅ COMPLETED: Hybrid schema organization implemented**: Command-specific schemas in command types.ts, shared schemas in `/schemas/`
- **✅ COMPLETED: All commands have types.ts and components.tsx files**

### Current State
The CLI has a complete project structure with TypeScript configuration and all file stubs in place. The foundation is ready for implementation of the actual command logic, API integration, and Ink UI components. All major architectural decisions have been made and reflected in the file structure.

## Ink Component Organization Strategy

### Hybrid Component Architecture

We've implemented a **hybrid approach** to Ink component organization that balances locality with reusability:

#### Command-Specific Components (Local)
- **Location**: `/apps/cli/src/commands/[command]/components.tsx`
- **Purpose**: UI components that are specific to a single command
- **Benefits**: 
  - **Discoverability**: Components are co-located with the command logic
  - **Context**: Direct access to command-specific types and helpers
  - **Isolation**: Changes don't affect other commands

#### Shared Components (Global)
- **Location**: `/apps/cli/src/components/`
- **Purpose**: Reusable UI patterns used across multiple commands
- **Organization**: Grouped by functionality (common/, forms/, tables/, etc.)
- **Benefits**:
  - **Reusability**: Single implementation used across commands
  - **Consistency**: Unified look and feel across the CLI
  - **Maintainability**: Centralized updates for common patterns

### Directory Structure

```
src/
├── commands/
│   ├── auth/
│   │   ├── index.ts           # Command implementation
│   │   ├── components.tsx     # Auth-specific UI components
│   │   ├── types.ts           # Command-specific types
│   │   └── helpers.ts         # Command utilities
│   ├── init/
│   │   ├── index.ts
│   │   ├── components.tsx     # Init-specific UI components
│   │   ├── types.ts
│   │   └── helpers.ts
│   └── ...
├── components/                # Shared, reusable Ink components
│   ├── common/               # Common UI patterns
│   │   ├── ErrorBox.tsx      # 🚧 STUBBED - Error display component
│   │   ├── SuccessBox.tsx    # 🚧 STUBBED - Success message component
│   │   └── index.ts          # Exports for common components
│   ├── forms/                # Reusable form components
│   │   ├── TextInput.tsx     # Enhanced text input with validation
│   │   ├── SelectInput.tsx   # Selection component with options
│   │   ├── ConfirmPrompt.tsx # Yes/no confirmation prompts
│   │   └── index.ts
│   ├── tables/               # Table display components
│   │   ├── DataTable.tsx     # Structured data display
│   │   ├── ConfigTable.tsx   # Configuration key-value display
│   │   └── index.ts
│   ├── progress/             # Progress indicators
│   │   ├── ProgressBar.tsx   # 🚧 STUBBED - Progress bar component
│   │   ├── Spinner.tsx       # Loading spinner
│   │   ├── StepProgress.tsx  # Multi-step progress indicator
│   │   └── index.ts
│   ├── prompts/              # Input prompts
│   │   ├── PasswordPrompt.tsx # Secure password input
│   │   ├── MultiSelect.tsx    # Multiple selection prompt
│   │   └── index.ts
│   └── status/               # Status displays
│       ├── StatusBadge.tsx   # Status indicator badges
│       ├── ServiceStatus.tsx # Service health display
│       └── index.ts
```

### Component Decision Matrix

| Component Type | Where to Place | Examples |
|----------------|----------------|----------|
| Command-specific logic display | Command folder | Auth credential form, Init project setup wizard |
| Reusable UI patterns | Shared components | Error boxes, progress bars, confirmation prompts |
| Data formatting specific to command | Command folder | Deploy validation results, Parse error display |
| Common interaction patterns | Shared components | Text inputs, tables, spinners |
| Command workflow orchestration | Command folder | Multi-step auth flow, Service startup sequence |
| Generic utility components | Shared components | Success/error messages, loading indicators |

### Best Practices for Ink Components

#### When to Create Shared vs Command-Specific Components

**Create Shared Components When**:
- The component will be used by 2+ commands
- It represents a common UI pattern (errors, success, loading)
- It handles generic data types (strings, numbers, basic objects)
- The component has no command-specific business logic

**Create Command-Specific Components When**:
- The component is unique to one command's workflow
- It handles command-specific data structures or types
- The component contains command-specific business logic
- The UI is highly customized for a specific use case

#### Component Props Design for Reusability

```typescript
// Good: Generic, reusable props
interface ErrorBoxProps {
  title: string;
  message: string;
  details?: string[];
  onDismiss?: () => void;
}

// Good: Command-specific props
interface AuthFormProps {
  initialCredentials?: Partial<Credentials>;
  onSubmit: (credentials: Credentials) => Promise<void>;
  validationErrors?: AuthValidationErrors;
}
```

#### State Management Within Ink Components

- **Local State**: Use React hooks (useState, useEffect) for component-specific state
- **Command State**: Pass state and handlers down from command implementation
- **Global State**: Use React Context for cross-component state (sparingly)
- **Validation State**: Handle validation errors through props, not internal state

#### Testing Strategies

**Shared Component Testing**:
- Unit tests for each shared component in isolation
- Test all prop combinations and edge cases
- Mock external dependencies (API calls, file system)
- Test keyboard navigation and accessibility

**Command Component Testing**:
- Integration tests with command logic
- Test component interaction with command state
- Mock command-specific dependencies
- Test complete user workflows

**Example Test Structure**:
```
/components/common/ErrorBox.test.tsx     # Shared component unit tests
/commands/auth/components.test.tsx       # Command component integration tests
/tests/components/                       # Cross-component integration tests
```

### Implementation Status

#### ✅ COMPLETED: Hybrid Component Structure Implemented
- Hybrid directory structure created with command-specific and shared component areas
- Command folders with components.tsx files stubbed for all commands
- Shared components directory organized by functionality (common/, forms/, tables/, progress/, prompts/, status/)
- Index files for proper exports and discoverability
- Clear decision matrix for component placement established

#### 🚧 STUBBED: Basic Components Ready for Implementation
- Basic shared components (ErrorBox, SuccessBox, ProgressBar) stubbed in `/components/common/`
- Command-specific components structure in place in each command folder
- Export patterns established for both shared and command-specific components
- Component testing patterns defined

#### ⏳ PENDING: Full Implementation
- Full implementation of shared component library with proper props interfaces
- Command-specific component implementations with business logic integration
- Comprehensive component testing strategies (unit tests for shared, integration tests for command-specific)
- Props interface standardization and reusability optimization

### Benefits of Hybrid Approach

1. **Discoverability**: Developers can find command-specific UI alongside the command logic
2. **Reusability**: Common patterns are shared and consistent across commands
3. **Maintainability**: Shared components can be updated once, command-specific components remain isolated
4. **Testing**: Clear separation allows for focused unit tests (shared) and integration tests (command-specific)
5. **Performance**: Components can be optimized for their specific use cases
6. **Developer Experience**: Clear guidelines on where to place new components

## Overview

This document outlines the migration of the Rust-based Buster CLI to TypeScript with a **beautiful Ink-based terminal UI**. The CLI is designed as a **thin client with rich UI** that primarily handles file system operations and acts as a gateway to the server API. All business logic, semantic model creation, and data source introspection is handled by the server API.

**CRITICAL: This CLI uses Ink and React for ALL user interface components. We are NOT building a simple console application.**

### Core Architecture Principle
The CLI serves as a **file system operator and API client only**:
- File and folder creation/management
- YAML file validation and parsing
- Authentication and configuration management  
- Service orchestration (Docker)
- All semantic modeling handled by server API via introspection
- No dbt catalog integration needed
- No direct SQL file processing

## Current Rust CLI Analysis - SIMPLIFIED SCOPE

### Simplified Commands and Functionality

1. **Authentication (`auth`)**
   - Interactive credential management
   - Environment variable support (BUSTER_HOST, BUSTER_API_KEY)
   - Local/cloud instance configuration
   - Credential caching and validation

2. **Initialization (`init`) - SIMPLIFIED**
   - Creates buster folder structure only
   - Generates buster.yml configuration file
   - Creates docs/ and metadata/ folders
   - NO database connection setup
   - NO data source creation
   - NO dbt integration

3. **~~Generation (`generate`) - REMOVED~~**
   - ~~Semantic model YAML generation from dbt catalog~~
   - ~~SQL file processing and model creation~~
   - ~~Directory structure management~~
   - ~~Integration with dbt docs generate~~

4. **Deployment (`deploy`)**
   - Model validation and deployment via server API
   - Cross-project reference validation via server API
   - Dry-run support
   - File processing via server API

5. **Parsing (`parse`)**
   - YAML model file validation
   - Configuration resolution
   - Error reporting and validation

6. **Configuration (`config`)**
   - Interactive LLM and Reranker settings management
   - API key management
   - Environment file updates

7. **Service Management (`start`, `stop`, `reset`)**
   - Docker Compose service orchestration
   - Persistent application environment setup
   - Asset extraction and configuration
   - Telemetry management

8. **Update (`update`)**
   - Self-update functionality with auto-update capability
   - GitHub releases integration
   - Binary replacement and verification
   - Cross-platform support

9. **~~Chat (TUI Application) - REMOVED~~**
   - ~~Interactive terminal UI using Ratatui~~
   - ~~AI agent integration~~
   - ~~File operations and command execution~~
   - ~~Real-time chat interface with completions~~

## Zod-First Type System and Validation Strategy

### Core Philosophy
Following the monorepo pattern: **"We use Zod schemas and then export them as types"**

All CLI types will be defined as Zod schemas first, then exported as TypeScript types for compile-time checking. This ensures:
- Runtime validation for all inputs (CLI args, YAML files, API responses)
- Type safety throughout the application
- Single source of truth for data structures
- Automatic serialization/deserialization
- Rich error reporting with detailed validation messages

### Zod Integration Points

1. **Command Input Validation**: All CLI command arguments and options validated with Zod
2. **YAML File Validation**: buster.yml and semantic model files validated with comprehensive schemas
3. **Configuration Validation**: All configuration files and settings validated at load time
4. **API Integration**: Server API request/response validation using @buster/server-shared schemas
5. **Environment Validation**: Environment variables validated with Zod schemas
6. **File System Operations**: File content validation before processing

### Dependencies Mapping - WITH INK UI

| Rust Dependency | TypeScript Equivalent | Purpose | CLI Usage Priority |
|----------------|----------------------|---------|-------------------|
| `clap` | `commander` + **Zod validation** | CLI argument parsing + validation | **HIGH** |
| `ratatui` + `crossterm` | **Ink ecosystem** | Terminal UI framework | **HIGH** |
| - ratatui widgets | `ink-text-input` | Text input components | **HIGH** |
| - ratatui selectable | `ink-select-input` | Selection components | **HIGH** |
| - ratatui table | `ink-table` | Table display | **HIGH** |
| - ratatui progress | Custom Ink progress bars | Progress indicators | **HIGH** |
| - ratatui spinner | `ink-spinner` | Loading indicators | **HIGH** |
| `tokio` | Native Node.js async | Async runtime | **HIGH** |
| `reqwest` | Native `fetch` + **Zod response validation** | HTTP client | **HIGH** |
| `serde` + `serde_yaml` | `js-yaml` + **Zod schemas** | YAML parsing + validation | **HIGH** |
| `serde_json` | Native JSON + **Zod schemas** | JSON handling + validation | **HIGH** |
| `inquire` | **Ink input components** + **Zod validation** | Interactive prompts with rich UI | **HIGH** |
| `indicatif` | **Ink progress components** | Progress indicators | **HIGH** |
| `colored` | **Ink color props** | Terminal colors | **HIGH** |
| `glob` | `fast-glob` | File pattern matching | **MEDIUM** |
| `tempfile` | `tmp` | Temporary files | **LOW** |
| `regex` | Native RegExp | Regular expressions | **MEDIUM** |
| `anyhow`/`thiserror` | **Zod error handling** + Custom errors | Error management | **HIGH** |
| `dirs` | `os.homedir()` | Directory utilities | **HIGH** |
| `confy` | **Zod-validated config management** | Configuration | **HIGH** |
| `zip` | `yauzl`/`yazl` | Archive handling | **MEDIUM** |

### Hybrid Schema Organization - IMPLEMENTED

We've implemented a **hybrid approach** to schema organization that balances locality with reusability:

#### Command-Specific Schemas (Local)
- **Location**: `/apps/cli/src/commands/[command]/types.ts`
- **Purpose**: Zod schemas and types specific to a single command
- **Examples**: AuthArgsSchema, DeployArgsSchema, InitArgsSchema
- **Benefits**: Co-located with command logic, easy to find and modify

#### Shared Schemas (Global)
- **Location**: `/apps/cli/src/schemas/`
- **Purpose**: Schemas used by multiple commands or shared data structures
- **Organization**: Grouped by functionality (config/, models/, api/)
- **Benefits**: Single source of truth, consistent validation across commands

```
src/
├── commands/
│   ├── auth/
│   │   ├── index.ts
│   │   ├── types.ts         # AuthArgsSchema (command-specific)
│   │   └── components.tsx
│   ├── deploy/
│   │   ├── index.ts
│   │   ├── types.ts         # DeployArgsSchema (command-specific)
│   │   └── components.tsx
│   └── ...
├── schemas/                 # Shared schemas only
│   ├── config.ts           # BusterYmlSchema, CLIConfigSchema
│   ├── models.ts           # SemanticModelSchema
│   ├── api.ts              # ApiErrorSchema, shared API schemas
│   └── index.ts            # Central exports
```

#### Schema Placement Guidelines

**Command-Specific Schemas (commands/*/types.ts)**:
- Command argument and option schemas
- Command-specific validation rules
- Types that are only used by one command
- Examples: `AuthArgsSchema`, `InitOptionsSchema`, `DeployValidationSchema`

**Shared Schemas (schemas/)**:
- Configuration file schemas (buster.yml, CLI config)
- Data model schemas used across commands
- API request/response schemas
- Common validation patterns
- Examples: `BusterYmlSchema`, `SemanticModelSchema`, `ApiErrorSchema`

### Decision Matrix for Schema Placement

| Schema Type | Where to Place | Reasoning |
|-------------|----------------|-----------|
| Command argument validation | Command's types.ts | Used only by that command, co-located with logic |
| Configuration file formats | schemas/config.ts | Used across multiple commands for parsing/validation |
| API request/response types | schemas/api.ts | Shared across commands that make API calls |
| Data model structures | schemas/models.ts | Used by parse, deploy, and validation commands |
| Error handling types | schemas/api.ts | Common error patterns across all API interactions |

### Implementation Status

- ✅ **COMPLETED**: Hybrid schema organization implemented
- ✅ **COMPLETED**: All commands have types.ts files with command-specific schemas
- ✅ **COMPLETED**: Shared schemas organized in /schemas/ directory
- ✅ **COMPLETED**: Clear separation between local and shared validation logic

## Monorepo Integration Strategy

### Package Structure

```
apps/
├── cli/                       # New TypeScript CLI (replaces Rust) - SIMPLIFIED
│   ├── src/
│   │   ├── commands/          # Command-specific folders (simplified)
│   │   │   ├── auth/
│   │   │   │   ├── index.ts       # Command implementation
│   │   │   │   ├── types.ts       # Command-specific Zod schemas and exported types
│   │   │   │   ├── helpers.ts     # Command helpers
│   │   │   │   └── auth.test.ts   # Command tests
│   │   │   ├── init/              # SIMPLIFIED - folder creation only
│   │   │   ├── deploy/            # API calls only
│   │   │   ├── parse/             # YAML validation only
│   │   │   ├── config/            # Settings management
│   │   │   ├── start/             # Service start
│   │   │   ├── stop/              # Service stop
│   │   │   ├── reset/             # Service reset
│   │   │   └── update/            # Auto-update
│   │   ├── schemas/           # Shared Zod schemas only
│   │   │   ├── config.ts      # Configuration schemas (buster.yml, CLI config)
│   │   │   ├── models.ts      # Basic model schemas
│   │   │   ├── api.ts         # API integration schemas
│   │   │   └── index.ts       # Schema exports
│   │   ├── lib/               # Shared CLI utilities
│   │   │   ├── api-client.ts      # Server API client + Zod validation
│   │   │   ├── config.ts          # Zod-validated config management
│   │   │   ├── errors.ts          # Zod error handling + custom errors
│   │   │   ├── validation.ts      # Zod validation utilities
│   │   │   ├── yaml.ts            # YAML parsing + Zod validation
│   │   │   ├── fs-utils.ts        # File system utilities
│   │   │   └── prompts.tsx        # Ink-based prompting components
│   │   ├── components/        # Ink UI components
│   │   │   ├── forms/         # Form components
│   │   │   ├── tables/        # Table display components
│   │   │   ├── progress/      # Progress and spinner components
│   │   │   ├── prompts/       # Input and selection components
│   │   │   └── status/        # Status display components
│   │   └── main.ts            # CLI entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
└── (current Rust CLI removed after migration)
```

### Integration Points - SIMPLIFIED

1. **CLI as Thin Client**: CLI is purely a file system operator and API client
   - File and folder creation/management
   - YAML parsing and validation
   - Authentication and configuration
   - Service orchestration (Docker)
   - ALL business logic via server API
2. **Zod-First Types**: Use Zod schemas from `@buster/server-shared` for API validation only
3. **Server API Gateway**: All semantic modeling, introspection, and data operations via server
4. **Configuration**: Simple Zod-validated configuration system
5. **Testing**: Basic Vitest patterns with focused schema testing
6. **Build**: Minimal turbo pipeline integration (build, lint, test)

### Zod Integration with Server-Shared

```typescript
// CLI schemas extend and re-export server-shared schemas
// apps/cli/src/schemas/api.ts - Shared API schemas
export { 
  // Re-export server-shared schemas for CLI use
  CreateDataSourceRequestSchema,
  CreateDataSourceResponseSchema,
  ValidateModelRequestSchema,
  ValidateModelResponseSchema 
} from '@buster/server-shared';

// Add CLI-specific API error handling
export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.record(z.any()).optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
```

## YAML Validation Strategy with Zod

### Core YAML Files Requiring Validation

1. **buster.yml**: Project configuration file
2. **Semantic Model Files**: YAML files defining data models
3. **dbt_project.yml**: dbt integration configuration
4. **CLI Configuration**: Local CLI settings

### YAML Parsing and Validation Pipeline

```typescript
// apps/cli/src/lib/yaml.ts
import yaml from 'js-yaml';
import type { z } from 'zod';
import { BusterYmlSchema } from '../schemas/config/buster-yml.js';
import { SemanticModelSchema } from '../schemas/models/semantic-model.js';

export async function parseAndValidateYaml<T>(
  filePath: string, 
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const parsedYaml = yaml.load(fileContent);
    
    // Zod validation with detailed error reporting
    const result = schema.safeParse(parsedYaml);
    
    if (!result.success) {
      throw new YamlValidationError(
        `Invalid YAML structure in ${filePath}`,
        result.error.errors,
        filePath
      );
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof YamlValidationError) throw error;
    throw new YamlParsingError(`Failed to parse YAML file: ${filePath}`, error);
  }
}

// Specialized functions for each YAML type
export const parseBusterYml = (filePath: string) => 
  parseAndValidateYaml(filePath, BusterYmlSchema);

export const parseSemanticModel = (filePath: string) => 
  parseAndValidateYaml(filePath, SemanticModelSchema);
```

### Buster.yml Schema Definition (Shared Schema)

```typescript
// apps/cli/src/schemas/config.ts - Shared schemas used by multiple commands
import { z } from 'zod';

const DatabaseTypeSchema = z.enum([
  'postgresql', 'mysql', 'redshift', 'bigquery', 
  'snowflake', 'sqlserver', 'databricks'
]);

// SIMPLIFIED - No database connections, just project structure
export const BusterYmlSchema = z.object({
  version: z.string(),
  project_name: z.string(),
  api_endpoint: z.string().url().optional(),
  config: z.object({
    models_path: z.string().default('./models'),
    docs_path: z.string().default('./docs'),
    metadata_path: z.string().default('./metadata'),
  }).optional(),
});

export const CLIConfigSchema = z.object({
  defaultHost: z.string().url().optional(),
  autoUpdate: z.boolean().default(true),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type BusterYmlConfig = z.infer<typeof BusterYmlSchema>;
export type CLIConfig = z.infer<typeof CLIConfigSchema>;
```

### Basic Model Validation Schema - SIMPLIFIED (Shared Schema)

```typescript
// apps/cli/src/schemas/models.ts - Shared schemas for model validation
import { z } from 'zod';

// Basic YAML validation only - no complex model structure since server handles introspection
export const SemanticModelSchema = z.object({
  version: z.string(),
  model: z.object({
    name: z.string(),
    description: z.string().optional(),
  }),
});

export type SemanticModel = z.infer<typeof SemanticModelSchema>;
```

### Command Input Validation Patterns

```typescript
// Example: apps/cli/src/commands/init/types.ts - HYBRID APPROACH
import { z } from 'zod';

// Command-specific schemas stay in command's types.ts
export const InitCommandArgsSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  outputDir: z.string().default('./'),
  force: z.boolean().default(false),
});

// No database connection options - server handles that via API
export const InitCommandOptionsSchema = z.object({
  apiEndpoint: z.string().url().optional(),
});

export type InitCommandArgs = z.infer<typeof InitCommandArgsSchema>;
export type InitCommandOptions = z.infer<typeof InitCommandOptionsSchema>;
```

## Zod Error Handling and Validation Patterns

### Error Hierarchy with Zod Integration

```typescript
// apps/cli/src/lib/errors.ts
import type { z } from 'zod';

export class BusterCliError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'BusterCliError';
  }
}

export class ZodValidationError extends BusterCliError {
  constructor(
    message: string,
    public zodErrors: z.ZodError['errors'],
    public filePath?: string
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ZodValidationError';
  }

  getFormattedErrors(): string {
    return this.zodErrors
      .map(error => `${error.path.join('.')}: ${error.message}`)
      .join('\n');
  }
}

export class YamlValidationError extends ZodValidationError {
  constructor(message: string, zodErrors: z.ZodError['errors'], filePath: string) {
    super(message, zodErrors, filePath);
    this.code = 'YAML_VALIDATION_ERROR';
    this.name = 'YamlValidationError';
  }
}

export class CommandValidationError extends ZodValidationError {
  constructor(command: string, zodErrors: z.ZodError['errors']) {
    super(`Invalid arguments for command: ${command}`, zodErrors);
    this.code = 'COMMAND_VALIDATION_ERROR';
    this.name = 'CommandValidationError';
  }
}
```

### Validation Utility Functions

```typescript
// apps/cli/src/lib/validation.ts
import type { z } from 'zod';
import { CommandValidationError, ZodValidationError } from './errors.js';

export function validateWithSchema<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context?: string
): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    if (context) {
      throw new ZodValidationError(
        `Validation failed for ${context}`,
        result.error.errors
      );
    }
    throw new ZodValidationError('Validation failed', result.error.errors);
  }
  
  return result.data;
}

export function validateCommandArgs<T>(
  args: unknown,
  schema: z.ZodSchema<T>,
  commandName: string
): T {
  const result = schema.safeParse(args);
  
  if (!result.success) {
    throw new CommandValidationError(commandName, result.error.errors);
  }
  
  return result.data;
}

// Helper for safe parsing with defaults
export function parseWithDefaults<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: z.ZodError['errors'] } {
  const result = schema.safeParse(data);
  return result.success 
    ? { success: true, data: result.data }
    : { success: false, errors: result.error.errors };
}
```

### Simple Prompting with Zod Validation - SIMPLIFIED

```typescript
// Example: Simple readline prompting with validation
// apps/cli/src/lib/prompts.ts
import * as readline from 'node:readline';
import type { z } from 'zod';

export async function promptWithValidation<T>(
  question: string,
  schema: z.ZodSchema<T>,
  retries = 3
): Promise<T> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  for (let attempt = 0; attempt < retries; attempt++) {
    const answer = await new Promise<string>((resolve) => {
      rl.question(question, resolve);
    });

    const result = schema.safeParse(answer);
    
    if (result.success) {
      rl.close();
      return result.data;
    }

    console.error(`❌ Invalid input: ${result.error.errors.map(e => e.message).join(', ')}`);
    
    if (attempt === retries - 1) {
      rl.close();
      throw new Error('Max retries exceeded for input validation');
    }
  }

  rl.close();
  throw new Error('Input validation failed');
}
```

### Package.json Structure

```json
{
  "name": "@buster-app/cli",
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/main.ts"
    }
  },
  "bin": {
    "buster": "./dist/main.js"
  },
  "scripts": {
    "prebuild": "tsx scripts/validate-env.ts && pnpm run typecheck",
    "build": "tsup",
    "build:dry-run": "tsup",
    "build:binary": "bun build --compile --outfile buster ./src/main.ts",
    "dev": "tsx --watch src/main.ts",
    "lint": "biome check --write",
    "test": "vitest run",
    "test:unit": "vitest run --exclude '**/*.int.test.ts'",
    "test:integration": "vitest run **/*.int.test.ts",
    "test:watch": "vitest --watch",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@buster/server-shared": "workspace:*",
    "@buster/typescript-config": "workspace:*",
    "@buster/vitest-config": "workspace:*",
    "commander": "^12.0.0",
    "zod": "catalog:",
    "js-yaml": "^4.1.0",
    "fast-glob": "^3.3.2",
    "tmp": "^0.2.1",
    "yauzl": "^3.0.0",
    "yazl": "^2.5.1",
    "ink": "^5.0.1",
    "react": "^18.2.0",
    "ink-text-input": "^6.0.0",
    "ink-select-input": "^6.0.0",
    "ink-table": "^3.0.0",
    "ink-spinner": "^5.0.0"
  }
}
```

### Turbo Integration Updates

**Root turbo.json changes**:
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    // ... existing tasks
  }
}
```

**Root vitest.config.ts changes**:
```typescript
export default defineConfig({
  test: {
    projects: [
      // ... existing packages
      'apps/cli',  // Add CLI to test projects
    ],
  },
});
```

**Root tsconfig.json changes**:
```json
{
  "references": [
    // ... existing references
    { "path": "./apps/cli" },  // Add CLI reference
  ]
}
```

## Implementation Plan

**IMPLEMENTATION REQUIREMENT: All UI components MUST use Ink and React. This is NOT a simple console application.**

### Phase 1: Core Infrastructure (Week 1-2)

#### Ticket 1.1: TypeScript CLI Foundation with Zod Schema Infrastructure and Ink UI 🚧 STUBBED
**Dependencies**: None
**Affected Packages**: `apps/cli`

**Tasks**:
- Set up TypeScript CLI package structure following monorepo patterns
- Configure tsup build system (consistent with apps/server)
- Implement Commander.js command structure with Zod validation
- Set up Ink UI framework with React components
- Create Zod-based error handling system with detailed validation errors
- Set up centralized Zod schema organization (src/schemas/)
- Create Ink component library structure (src/components/)
- Integrate with turbo pipeline (build, lint, test, typecheck, schema-validation tasks)
- Set up vitest configuration using @buster/vitest-config
- Configure TypeScript using @buster/typescript-config

**Key Files**:
- `/apps/cli/package.json` - Include turbo tasks, workspace dependencies, Zod, Ink ecosystem
- `/apps/cli/src/main.ts` - CLI entry point with commander + Zod validation
- `/apps/cli/src/lib/errors.ts` - Zod validation error hierarchy
- `/apps/cli/src/lib/command-base.ts` - Base command class with Zod validation
- `/apps/cli/src/lib/validation.ts` - Zod validation utilities
- `/apps/cli/src/components/` - Ink UI component library
- `/apps/cli/src/schemas/index.ts` - Central schema exports
- `/apps/cli/vitest.config.ts` - Test configuration
- `/apps/cli/tsconfig.json` - Extends @buster/typescript-config

**Zod and Ink Integration**:
- Set up hybrid schema organization (command-specific in types.ts, shared in schemas/)
- Create validation utilities for CLI arguments and options
- Implement detailed error reporting for validation failures with Ink error components
- Set up Ink component library with forms, tables, progress indicators
- Add schema testing patterns and Ink component testing
- Create reusable Ink components for validation error display

**Turbo Integration**:
- Add CLI to turbo.json tasks
- Add to root vitest.config.ts projects array
- Add to root tsconfig.json references

**Test Requirements**:
- Unit tests for command parsing with Zod validation (*.test.ts)
- Shared Ink component rendering tests (components/**/*.test.tsx)
- Command-specific component integration tests (commands/**/components.test.tsx)
- Schema validation tests
- CLI help system verification with Ink components
- Command registration tests
- Zod error handling tests with shared ErrorBox component
- Ink user interaction simulation tests

#### Ticket 1.2: Server API Client Integration with Zod Validation 🚧 STUBBED
**Dependencies**: Ticket 1.1
**Affected Packages**: `apps/cli`, `@buster/server-shared`

**Tasks**:
- Implement HTTP client for server API communication with full Zod validation
- Re-export and extend Zod schemas from @buster/server-shared for all API contracts
- Create authentication wrapper with Zod-validated credentials
- Add comprehensive request/response validation using shared Zod schemas
- Implement retry and error handling with Zod error parsing
- No direct database or AI package usage - all via server API

**Key Files**:
- `/apps/cli/src/lib/api-client.ts` - Main API client with Zod validation
- `/apps/cli/src/lib/http-client.ts` - HTTP wrapper with auth + validation
- `/apps/cli/src/lib/auth.ts` - Authentication helpers with Zod schemas
- `/apps/cli/src/schemas/api.ts` - API schemas and server-shared re-exports
- `/apps/cli/src/schemas/config.ts` - Configuration file schemas
- `/apps/cli/src/schemas/models.ts` - Model validation schemas

**Zod Server-Shared Integration**:
```typescript
// Re-export server-shared schemas with CLI extensions
export { 
  CreateDataSourceRequestSchema,
  CreateDataSourceResponseSchema,
  ValidateModelRequestSchema,
  ValidateModelResponseSchema 
} from '@buster/server-shared';

// CLI-specific API error schema (shared across commands)
export const ApiErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.record(z.any()).optional(),
});
```

**Test Requirements**:
- API client unit tests with Zod-validated mocked responses
- Authentication flow tests with schema validation
- Request/response Zod validation tests
- Zod error handling and parsing tests
- Schema compatibility tests with @buster/server-shared

#### Ticket 1.3: Configuration and Local Storage with YAML Validation 🚧 STUBBED
**Dependencies**: Ticket 1.2
**Affected Packages**: `apps/cli`

**Tasks**:
- Implement Zod-validated local configuration file handling (buster.yml)
- Create comprehensive YAML parsing and validation system
- Add credential storage and retrieval with Zod schemas (encrypted)
- Implement environment variable management with Zod validation using turbo.json globalEnv patterns
- Create configuration validation pipeline with detailed error reporting
- Support for different environments (local, cloud) with schema-based validation

**Key Files**:
- `/apps/cli/src/lib/config.ts` - Zod-validated configuration management
- `/apps/cli/src/lib/yaml.ts` - YAML parsing and validation utilities
- `/apps/cli/src/lib/credentials.ts` - Secure credential storage with schemas
- `/apps/cli/src/lib/environment.ts` - Environment variable handling with Zod
- `/apps/cli/src/commands/config/components.tsx` - Config-specific Ink components
- `/apps/cli/src/components/forms/TextInput.tsx` - Shared text input component
- `/apps/cli/src/schemas/config.ts` - Configuration schemas (buster.yml, CLI config)
- `/apps/cli/src/schemas/api.ts` - API schemas and error handling
- `/apps/cli/src/schemas/models.ts` - Semantic model schemas
- `/apps/cli/src/schemas/index.ts` - Central exports

**Zod YAML Integration**:
```typescript
// YAML validation utility
export async function parseAndValidateYaml<T>(
  filePath: string, 
  schema: z.ZodSchema<T>
): Promise<T> {
  const fileContent = await fs.readFile(filePath, 'utf8');
  const parsedYaml = yaml.load(fileContent);
  
  const result = schema.safeParse(parsedYaml);
  if (!result.success) {
    throw new YamlValidationError(
      `Invalid YAML structure in ${filePath}`,
      result.error.errors,
      filePath
    );
  }
  return result.data;
}
```

**Test Requirements**:
- Configuration loading/saving tests with Zod validation
- YAML parsing and validation tests
- Environment variable precedence tests with schemas
- Credential encryption/decryption tests with Zod validation
- Comprehensive schema validation error testing
- buster.yml schema compatibility tests
- Ink form component tests for configuration management
- Shared component unit tests for reusable patterns

### Phase 2: Core Commands - SIMPLIFIED (Week 3-4)

#### Ticket 2.1: Authentication Command with Simple Prompts and Zod Validation 🚧 STUBBED
**Dependencies**: Ticket 1.3
**Affected Packages**: `apps/cli`

**Tasks**:
- Implement `auth` command with Zod-validated inputs using simple readline prompts
- Add Zod-validated environment variable support
- Create credential validation via server API with Zod response validation
- Add local/cloud configuration options with schema-based validation

**Key Files**:
- `/apps/cli/src/commands/auth/index.ts` - Command implementation with Zod validation
- `/apps/cli/src/commands/auth/components.tsx` - Auth-specific Ink components
- `/apps/cli/src/commands/auth/types.ts` - Auth-specific Zod schemas and exported types
- `/apps/cli/src/commands/auth/helpers.ts` - Auth utilities with validation
- `/apps/cli/src/commands/auth/auth.test.ts` - Command tests with schema testing
- `/apps/cli/src/components/common/ErrorBox.tsx` - Shared error display component

**Zod Auth Schemas**:
```typescript
// apps/cli/src/commands/auth/types.ts
export const AuthCommandOptionsSchema = z.object({
  host: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
  interactive: z.boolean().default(true),
  environment: z.enum(['local', 'cloud']).default('cloud'),
});

export const CredentialInputSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  host: z.string().url('Invalid host URL'),
});

export type AuthCommandOptions = z.infer<typeof AuthCommandOptionsSchema>;
export type CredentialInput = z.infer<typeof CredentialInputSchema>;
```

**Ink UI Components Used**:
- Ink text input for API key entry with Zod validation
- Rich Ink components for status messages and progress
- Beautiful error display using Ink error components

**Test Requirements**:
- Unit tests for auth logic with Zod validation (*.test.ts)
- Command-specific component tests (components.test.tsx)
- Shared component unit tests (components/common/ErrorBox.test.tsx)
- Mocked server API responses with schema validation
- Credential validation tests with Zod schemas
- Environment variable precedence tests with schema validation
- Comprehensive Zod error handling tests with shared ErrorBox
- Ink form interaction and validation display tests

#### Ticket 2.2: Configuration Command - SIMPLIFIED 🚧 STUBBED
**Dependencies**: Ticket 2.1
**Affected Packages**: `apps/cli`

**Tasks**:
- Implement simple configuration management using console output
- Create forms for LLM and Reranker settings using simple prompts
- Add environment file updates with confirmation prompts
- Configuration reset functionality with simple confirmation

**Key Files**:
- `/apps/cli/src/commands/config/index.ts` - Config command
- `/apps/cli/src/commands/config/types.ts` - Config types
- `/apps/cli/src/commands/config/helpers.ts` - Config utilities
- `/apps/cli/src/commands/config/config.test.ts` - Tests

**Ink UI Components Used**:
- Ink table components for rich configuration display
- Ink select input for option selection
- Rich Ink confirmation prompts for destructive actions

**Test Requirements**:
- Configuration update tests
- File modification tests
- Form validation tests

#### Ticket 2.3: Service Management Commands - SIMPLIFIED 🚧 STUBBED
**Dependencies**: Ticket 2.2
**Affected Packages**: `apps/cli`

**Tasks**:
- Implement `start`, `stop`, `reset` commands with simple console output
- Add Docker Compose integration with status logging
- Create asset extraction system with basic progress feedback
- Display service status in console format

**Key Files**:
- `/apps/cli/src/commands/start/index.ts` - Start command
- `/apps/cli/src/commands/stop/index.ts` - Stop command
- `/apps/cli/src/commands/reset/index.ts` - Reset command
- `/apps/cli/src/lib/docker-compose.ts` - Docker integration
- `/apps/cli/src/lib/assets.ts` - Asset management

**Ink UI Components Used**:
- Rich Ink status displays with colors and formatting
- Animated Ink progress bars and spinners for loading states
- Professional Ink service status components

**Test Requirements**:
- Docker Compose execution tests
- Asset extraction tests
- Service lifecycle tests

### Phase 3: File System and API Commands - SIMPLIFIED (Week 5-6)

#### Ticket 3.1: Initialization Command - File System Only 🚧 STUBBED
**Dependencies**: Ticket 2.3
**Affected Packages**: `apps/cli`

**Tasks**:
- Implement folder structure creation (buster/, docs/, metadata/)
- Create basic buster.yml configuration file
- NO database connection setup
- NO data source creation via API
- NO dbt integration

**Key Files**:
- `/apps/cli/src/commands/init/index.ts` - Init command (file system only)
- `/apps/cli/src/commands/init/types.ts` - Init types (simplified)
- `/apps/cli/src/commands/init/helpers.ts` - File system utilities
- `/apps/cli/src/commands/init/init.test.ts` - Tests
- `/apps/cli/src/lib/fs-utils.ts` - File system utilities

**File System Operations**:
- Create project directory structure
- Generate basic buster.yml with project name only
- Create empty docs/ and metadata/ folders
- Rich Ink progress display and confirmation messages

**Test Requirements**:
- File system creation tests
- Configuration generation tests  
- Directory structure validation tests
- Error handling for existing projects

#### Ticket 3.2: Deployment and Parsing Commands via Server API 🚧 STUBBED
**Dependencies**: Ticket 3.1
**Affected Packages**: `apps/cli`, `apps/server` (existing endpoints)

**Tasks**:
- Implement deployment validation via server API
- Add model parsing and validation through server endpoints
- Create cross-project reference checking via server
- Add dry-run functionality with console output
- Simple console-based validation result display

**Key Files**:
- `/apps/cli/src/commands/deploy/index.ts` - Deploy command
- `/apps/cli/src/commands/parse/index.ts` - Parse command
- `/apps/cli/src/commands/deploy/types.ts` - Deploy types
- `/apps/cli/src/commands/parse/types.ts` - Parse types

**Server API Integration**:
- Use existing server endpoints for model validation
- Stream validation results to console
- Use types from @buster/server-shared
- All business logic handled by server

**Ink UI Components Used**:
- Rich Ink tables for validation results
- Beautiful error/warning display with Ink components
- Professional Ink confirmation prompts for deployment
- Animated Ink progress indicators

**Test Requirements**:
- Deployment validation API tests
- Model parsing tests
- Cross-reference validation tests
- Dry-run functionality tests

### Phase 4: Advanced Features - SIMPLIFIED (Week 7)

#### Ticket 4.1: Update Command with Auto-Update ⏳ PENDING
**Dependencies**: Ticket 3.2
**Affected Packages**: `apps/cli`

**Tasks**:
- Implement self-update functionality with auto-update capability
- Add GitHub releases integration
- Create binary replacement system
- Add cross-platform support
- Auto-update check on CLI startup (configurable)

**Key Files**:
- `/apps/cli/src/commands/update/index.ts` - Update command
- `/apps/cli/src/lib/updater.ts` - Update logic
- `/apps/cli/src/lib/github-releases.ts` - GitHub integration
- `/apps/cli/src/lib/auto-update.ts` - Auto-update functionality

**Ink UI Components Used**:
- Rich Ink progress bars for update progress
- Professional Ink confirmation prompts
- Beautiful version comparison display with Ink components

**Test Requirements**:
- Update mechanism tests
- Version comparison tests
- Binary replacement tests
- Auto-update logic tests

### Phase 5: Testing and Documentation (Week 8)

#### Ticket 5.1: Comprehensive Testing ⏳ PENDING
**Dependencies**: All previous tickets
**Affected Packages**: `apps/cli`

**Tasks**:
- Complete unit test coverage for core commands
- Add integration test suites for file system operations
- Create end-to-end test scenarios for API interactions
- Add basic performance benchmarks

**Test Requirements**:
- Minimum 80% code coverage (reduced scope)
- All command scenarios tested
- Error handling verification
- Cross-platform compatibility tests

#### Ticket 5.2: Documentation and Migration ⏳ PENDING
**Dependencies**: Ticket 5.1
**Affected Packages**: `apps/cli`, root documentation

**Tasks**:
- Create basic CLI documentation
- Add migration guide from Rust CLI
- Update build and deployment scripts
- Create distribution packages

**Key Files**:
- `/apps/cli/README.md`
- `/apps/cli/MIGRATION.md`
- Distribution configuration files

### Phase 6: Deployment and Distribution (Week 9)

#### Ticket 6.1: Bun Compilation and Distribution ⏳ PENDING
**Dependencies**: Ticket 5.2
**Affected Packages**: `apps/cli`, CI/CD

**Tasks**:
- Set up Bun binary compilation for single executables
- Create cross-platform builds (Linux, macOS, Windows)
- Implement GitHub releases automation
- Add package distribution (npm, homebrew)
- Integrate with turbo build pipeline

**Key Files**:
- `/.github/workflows/cli-build.yml` - CI/CD pipeline
- `/apps/cli/scripts/build-binaries.js` - Build scripts
- `/apps/cli/package.json` - Bun build configuration
- Package manager configuration files

**Bun Integration**:
- Use `bun build --compile` for executable generation
- Cross-platform compilation targets
- Size optimization for distribution

#### Ticket 6.2: Migration and Rust CLI Removal ⏳ PENDING
**Dependencies**: Ticket 6.1
**Affected Packages**: `apps/cli`, documentation, CI/CD

**Tasks**:
- Create migration documentation
- Update installation instructions
- Remove Rust CLI from monorepo
- Update turbo.json and root configurations
- Monitor adoption and feedback

**Migration Steps**:
- Remove apps/cli Rust directory
- Update root tsconfig.json references
- Update turbo.json task configurations
- Update documentation and README files

## Simple Console Interface Strategy - SIMPLIFIED

### Console Output Patterns

**Basic Console Tools**:
- `console.table()` - Data display and configuration views
- `process.stdout.write()` - Progress indicators with dots/bars
- `readline` - User input prompts with validation
- Simple colored text for status (success/error/warning)

### UI Replacement Strategy

| Rust CLI Feature | Simple Console Equivalent | Usage in CLI |
|------------------|---------------------------|--------------|
| Interactive menus | Simple numbered prompts | Command options, selections |
| Data tables | `console.table()` | Configuration display, status |
| Progress bars | Text-based progress dots | File operations, API calls |
| Forms | Sequential readline prompts | Configuration setup |
| Confirmations | Simple y/n prompts | Destructive actions |
| Spinners | Rotating character or dots | Loading states |

### Console Utilities for CLI

**File System Operations**:
- Basic folder creation confirmation
- File listing with simple formatting
- Progress feedback for batch operations

**API Communication**:
- Simple request/response logging
- Error display with clear formatting
- Success/failure status messages

**Configuration Management**:
- Tabular configuration display
- Simple prompt-based editing
- Validation error display

### Benefits of Simple Console Interface

1. **Minimal Dependencies**: No complex UI libraries required
2. **Fast Startup**: No heavy rendering engine to initialize
3. **Universal Compatibility**: Works in all terminal environments
4. **Easy Testing**: Simple console output can be easily tested
5. **Maintainability**: No complex UI state management
6. **Performance**: Minimal overhead for CLI operations

## Architecture Decisions

### Framework Choices - RICH INK UI

1. **CLI Framework**: Commander.js for argument parsing and command structure
2. **Type System & Validation**: **Zod-first approach** - Focused on essential validation
   - Zod schemas for CLI args, YAML files, and API requests/responses
   - Runtime validation with compile-time type safety
   - Integration with @buster/server-shared Zod schemas for API only
   - Rich error handling for validation failures with Ink components
3. **Interface**: **REQUIRED Rich Ink UI Interface**:
   - `ink-text-input` for user input with Zod validation
   - `ink-table` for beautiful data display
   - `ink-spinner` and custom progress components
   - Rich Ink components with colors, formatting, and interactivity
   - React-based component architecture for maintainable UI
4. **HTTP Client**: Fetch API (native Node.js) with Zod request/response validation
5. **YAML Processing**: js-yaml with basic Zod schema validation
6. **Testing**: Vitest following monorepo patterns with focused schema testing
7. **Build System**: tsup (consistent with apps/server)
8. **Binary Generation**: Bun for single executable creation
9. **Type Safety**: Focused Zod integration with @buster/server-shared schemas for API calls only

### Integration Patterns - REQUIRED INK UI

1. **CLI as File System Operator**: CLI handles file/folder operations and acts as API client with rich UI
   - File and folder creation/management with Ink progress indicators
   - YAML parsing and validation with rich error displays
   - Authentication and configuration with Ink forms
   - Service orchestration (Docker) with real-time status updates
2. **Server-Centric Business Logic**: All semantic modeling, introspection, and data operations via server API
3. **Focused API Integration**: Use Zod schemas from `@buster/server-shared` for API calls only
4. **Rich Configuration UI**: Ink-based forms and displays for CLI settings management
5. **Comprehensive Testing**: Focused vitest patterns with Ink component testing (*.test.ts)
6. **Full Build Integration**: Complete turbo pipeline integration (build, lint, test, UI components)
7. **Rich UI Dependencies**: Workspace dependencies plus Ink ecosystem for professional interface
8. **Essential Validation**: Key data flows validated with Zod and displayed via rich Ink components

### Error Handling Strategy

```typescript
// Zod-integrated error hierarchy
export class BusterCliError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'BusterCliError';
  }
}

export class ZodValidationError extends BusterCliError {
  constructor(
    message: string,
    public zodErrors: z.ZodError['errors'],
    public filePath?: string
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ZodValidationError';
  }

  getFormattedErrors(): string {
    return this.zodErrors
      .map(error => `${error.path.join('.')}: ${error.message}`)
      .join('\n');
  }
}

export class YamlValidationError extends ZodValidationError {
  constructor(message: string, zodErrors: z.ZodError['errors'], filePath: string) {
    super(message, zodErrors, filePath);
    this.code = 'YAML_VALIDATION_ERROR';
  }
}

export class CommandValidationError extends ZodValidationError {
  constructor(command: string, zodErrors: z.ZodError['errors']) {
    super(`Invalid arguments for command: ${command}`, zodErrors);
    this.code = 'COMMAND_VALIDATION_ERROR';
  }
}
```

### Testing Strategy - SIMPLIFIED

1. **Unit Tests (*.test.ts)**: 
   - Individual functions and command logic
   - API client mocking with Zod validation
   - Configuration management
   - File system utilities

2. **Integration Tests (*.int.test.ts)**:
   - Full command execution with mocked server API
   - File system operations
   - Configuration file generation
   - Basic workflow testing

3. **Console Interface Tests**:
   - Console output verification
   - Readline input simulation
   - Error message formatting
   - Simple progress indicator testing

4. **Mock Strategy**:
   - Mock server API responses using MSW
   - Mock file system operations with temp directories
   - Mock external process execution (Docker)
   - Mock configuration file access

5. **Test Organization**:
   - Command tests in command directories: `/commands/auth/auth.test.ts`
   - Utility tests alongside utilities: `/lib/fs-utils.test.ts`
   - Integration tests in `/tests/integration/`
   - Test utilities in `/tests/utils/`

### Security Considerations

1. **Credential Storage**: Encrypt sensitive data at rest
2. **API Communication**: Use HTTPS with proper certificate validation
3. **Input Validation**: Sanitize all user inputs
4. **Environment Variables**: Secure handling of sensitive environment data

## Migration Timeline - SIMPLIFIED

- **Weeks 1-2**: Core infrastructure and foundation
- **Weeks 3-4**: Essential commands (auth, config, services)
- **Weeks 5-6**: File system commands (init) and API commands (deploy, parse)
- **Week 7**: Advanced features (auto-update)
- **Week 8**: Testing and documentation
- **Week 9**: Deployment and migration

## Success Criteria - SIMPLIFIED

1. **Functional Parity**: Essential Rust CLI commands replicated in TypeScript with simple console interface and focused Zod validation
2. **Performance**: CLI startup time under 300ms with minimal dependencies
3. **Focused Type Safety**: 
   - Key data structures defined as Zod schemas (CLI args, YAML files, API calls)
   - Runtime validation for essential inputs
   - Integration with @buster/server-shared Zod schemas for API only
   - Clear validation error reporting
4. **Monorepo Integration**: 
   - Basic turbo pipeline integration (build, lint, test)
   - Proper use of @buster/server-shared Zod schemas for API calls
   - CLI as thin file system operator and API client
5. **Essential Validation**:
   - Basic buster.yml schema validation
   - Simple YAML validation for configuration files
   - API request/response validation via server-shared schemas
6. **Rich Ink Interface**: 
   - Beautiful Ink-based interface with rich tables and interactive prompts
   - Animated progress indicators and real-time status updates
   - React-based component state management for complex UI interactions
7. **Testing**: 80%+ code coverage with focused schema and Ink component testing
8. **Type Safety**: Focused Zod schema integration for essential operations
9. **Distribution**: Bun-compiled single executable for all platforms with Ink UI
10. **Architecture**: Clean separation - CLI handles file system with rich UI, server handles business logic

## Risk Mitigation

1. **Parallel Development**: Keep Rust CLI functional during migration
2. **Incremental Migration**: Allow users to gradually adopt new CLI
3. **Compatibility**: Maintain configuration file compatibility
4. **Rollback Plan**: Keep Rust CLI available as fallback
5. **Testing**: Extensive testing across platforms and scenarios

## Post-Migration Tasks

1. **Performance Monitoring**: Track CLI usage and performance metrics
2. **User Feedback**: Collect and address user feedback
3. **Feature Enhancements**: Add TypeScript-specific improvements
4. **Maintenance**: Regular updates and security patches
5. **Documentation**: Keep documentation updated with new features

## Updated Implementation Summary: Rich UI Thin Client CLI

This updated plan transforms the CLI migration to a **rich UI, thin client architecture**:

### Core Transformation Principles - REQUIRED INK UI

1. **CLI as File System Operator**: Primary responsibility is file and folder management
   - Create project directory structures
   - Generate basic configuration files (buster.yml)
   - Handle YAML parsing and validation
   - Manage local CLI configuration and credentials

2. **Server-Centric Business Logic**: All complex operations handled by server API
   - Semantic model creation and introspection via server API
   - Data source connections managed by server
   - Model validation and deployment via server endpoints
   - No dbt catalog generation in CLI - server handles via introspection

3. **Focused Zod Integration**: Validation only where essential
   - CLI command arguments and options
   - Basic YAML file parsing (simplified buster.yml)
   - API request/response validation using @buster/server-shared schemas
   - Configuration file validation

4. **Rich Ink UI Interface**: Professional terminal UI framework
   - Ink text input components for user input
   - Ink table components for rich data display
   - Ink spinner and progress components with animations
   - Rich Ink components with colors, borders, and interactive elements

5. **Rich UI Dependencies**: Professional interface requirements
   - Commander.js for CLI structure
   - Zod for essential validation
   - js-yaml for configuration parsing  
   - Native Node.js APIs for most operations
   - **Ink ecosystem for beautiful terminal UI**
   - **React for component-based UI architecture**

6. **Essential Commands Only**: Focused command set
   - **auth**: Authentication and credential management
   - **init**: Folder structure creation (no database setup)
   - **config**: Simple configuration management
   - **deploy**: Model deployment via server API
   - **parse**: YAML validation
   - **start/stop/reset**: Service management
   - **update**: Auto-update functionality
   - **REMOVED**: generate command (server handles via introspection)
   - **REMOVED**: chat command (not needed)

7. **Accelerated Timeline**: Reduced from 12 weeks to 9 weeks
   - Weeks 1-2: Core infrastructure
   - Weeks 3-4: Essential commands
   - Weeks 5-6: File system and API commands
   - Week 7: Auto-update
   - Week 8: Testing and documentation
   - Week 9: Deployment

### Key Benefits of Required Rich Ink UI Approach

- **Exceptional User Experience**: Beautiful, professional Ink interface with rich interactions
- **Modern Terminal UI**: State-of-the-art React-based components for terminal applications
- **Professional Interface**: Rich visual feedback, colors, animations, and interactive components
- **Component Architecture**: Maintainable React components with proper state management
- **Clear Separation**: CLI handles file system with rich UI, server handles business logic
- **User Focus**: Streamlined commands with beautiful interface focus on essential user workflows
- **Future Flexibility**: Ink-based components can easily be extended and enhanced

**The CLI is NOT a simple console application**. It uses Ink and React to create a **professional, modern terminal interface** that excels at file system operations while delegating complex business logic to the server. This creates a cleaner architecture with better separation of concerns and an exceptional user experience.
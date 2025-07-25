# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Development Commands

```bash
# Development
bun run dev              # Run Mastra dev server (mastra dev --dir src)

# Testing  
bun run test             # Run all tests (vitest run)
bun run test:watch       # Run tests in watch mode (vitest watch)
bun run test:coverage    # Run tests with coverage (vitest run --coverage)

# Testing specific files
bun test src/agents/weather-agent.test.ts

# Run evaluation tests
npm run eval             # Run all evaluations with Braintrust
npm run eval:file weather-agent.eval.ts  # Run specific eval file
npm run eval:watch       # Run evaluations in watch mode
npm run eval:dev         # Run evaluations in dev mode

# From root directory
bun run lint packages/ai      # Run Biome linter
bun run lint:fix packages/ai  # Fix linting issues
bun run format packages/ai    # Check formatting
bun run format:fix packages/ai # Fix formatting
bun run typecheck packages/ai # Run TypeScript type checking
```

## Architecture Overview

This package implements AI agents and tools using the Mastra framework, integrated with observability through Braintrust. The codebase follows a modular pattern designed for building complex multi-agent workflows.

## Folder Structure & Patterns

### Source Code (`src/`)

#### **Agents** (`src/agents/`)
```
agents/
├── analyst-agent/
│   ├── analyst-agent.ts           # Agent definition
│   └── analyst-agent-instructions.ts # Instructions/prompts
└── think-and-prep-agent/
    ├── think-and-prep-agent.ts
    └── think-and-prep-instructions.ts
```

**Pattern**: Each agent gets its own folder with:
- Main agent file (defines tools, model, memory, options)
- Instructions file (contains system prompts and behavior definitions)
- Uses `Agent` from Mastra with `anthropicCachedModel`
- Shared memory via `getSharedMemory()`
- Standard options: `maxSteps: 18, temperature: 0, maxTokens: 10000`

#### **Steps** (`src/steps/`)
```
steps/
├── analyst-step.ts
├── create-todos-step.ts
├── extract-values-search-step.ts
├── generate-chat-title-step.ts
├── get-chat-history.ts
└── think-and-prep-step.ts
```

**Pattern**: Steps orchestrate agent execution within workflows:
- Use `createStep()` from Mastra
- Define input/output schemas with Zod
- Execute agents with proper context passing
- Handle message history extraction and formatting
- Wrap execution with `wrapTraced()` for observability
- Pass data between steps through structured schemas

#### **Tools** (`src/tools/`)
```
tools/
├── communication-tools/     # Agent-to-agent communication
│   ├── done-tool.ts
│   ├── respond-without-asset-creation.ts
│   └── submit-thoughts-tool.ts
├── database-tools/          # Data access
│   └── find-required-text-values.ts
├── file-tools/             # File operations
│   ├── bash-tool.ts
│   ├── edit-file-tool.ts
│   ├── read-file-tool.ts
│   └── write-file-tool.ts
├── planning-thinking-tools/ # Strategic planning
│   ├── create-plan-investigative-tool.ts
│   ├── create-plan-straightforward-tool.ts
│   ├── review-plan-tool.ts
│   └── sequential-thinking-tool.ts
├── visualization-tools/     # Dashboard/metrics creation
│   ├── create-dashboards-file-tool.ts
│   ├── create-metrics-file-tool.ts
│   ├── modify-dashboards-file-tool.ts
│   └── modify-metrics-file-tool.ts
└── index.ts                # Tool exports
```

**Pattern**: Tools are categorized by function:
- Use `createTool()` from Mastra
- Define input/output schemas with Zod
- Wrap main execution with `wrapTraced()` for observability
- Include detailed descriptions for agent understanding
- Export via `tools/index.ts` for easy importing

#### **Workflows** (`src/workflows/`)
```
workflows/
└── analyst-workflow.ts     # Multi-step workflow definition
```

**Pattern**: Workflows orchestrate multiple steps and agents:
- Use `createWorkflow()` from Mastra
- Define input/output schemas with Zod
- Chain steps with `.parallel()`, `.then()`, `.branch()` patterns
- Include runtime context interfaces for type safety
- Support conditional branching based on step outputs

#### **Utils** (`src/utils/`)
```
utils/
├── convertToCoreMessages.ts
├── shared-memory.ts
├── memory/
│   ├── agent-memory.ts
│   ├── message-history.ts    # Message passing between agents
│   ├── types.ts             # Message/step data types
│   └── index.ts
└── models/
    ├── ai-fallback.ts        # Fallback model wrapper with retry logic
    ├── anthropic.ts          # Basic Anthropic model wrapper
    ├── anthropic-cached.ts   # Anthropic with caching support
    ├── vertex.ts             # Google Vertex AI model wrapper
    ├── sonnet-4.ts           # Claude Sonnet 4 with fallback
    └── haiku-3-5.ts          # Claude Haiku 3.5 with fallback
```

**Pattern**: Utilities support core functionality:
- **Memory**: Handles message history between agents in multi-step workflows
- **Models**: Provides various AI model configurations with fallback support
- **Message History**: Critical for multi-agent workflows - extracts and formats messages for passing between agents

##### Model Configuration Pattern

The models folder provides different AI model configurations with automatic fallback support:

1. **Base Model Wrappers** (`anthropic.ts`, `vertex.ts`):
   - Wrap AI SDK models with Braintrust tracing
   - Handle authentication and configuration
   - Provide consistent interface for model usage

2. **Fallback Models** (`sonnet-4.ts`, `haiku-3-5.ts`):
   - Use `createFallback()` to define multiple model providers
   - Automatically switch between providers on errors
   - Configure retry behavior and error handling
   - Example: Sonnet4 tries Vertex first, falls back to Anthropic

3. **Cached Model** (`anthropic-cached.ts`):
   - Adds caching support to Anthropic models
   - Automatically adds cache_control to system messages
   - Includes connection pooling for better performance
   - Used by agents requiring prompt caching

**Usage Example**:
```typescript
// For general use with fallback support
import { Sonnet4, Haiku35 } from '@buster/ai';

// For agents with complex prompts needing caching
import { anthropicCachedModel } from '@buster/ai';

// Direct model usage (no fallback)
import { anthropicModel, vertexModel } from '@buster/ai';
```

### Testing Strategy (`tests/`)

#### **Test Structure**
```
tests/
├── agents/integration/          # End-to-end agent tests
├── steps/integration/           # Step execution tests
├── tools/
│   ├── integration/            # Tool + LLM integration tests
│   └── unit/                   # Pure function/schema tests
├── workflows/integration/       # Full workflow tests
├── globalSetup.ts
└── testSetup.ts
```

#### **Testing Philosophy**

**Unit Tests** (`tests/tools/unit/`):
- Test data structures, schemas, and logic flows
- Validate input/output schemas with Zod
- Test error handling and edge cases
- Mock external dependencies
- **DO NOT** test LLM quality/performance
- Focus on: "Does the function work correctly?"

**Integration Tests** (`tests/*/integration/`):
- Test agents/tools/steps with real LLM calls
- Verify workflow execution and data flow
- Test that agents can use tools successfully
- Validate message passing between agents
- **DO NOT** evaluate response quality
- Focus on: "Does the system work end-to-end?"

### Evaluation Strategy (`evals/`)

#### **Evaluation Structure**
```
evals/
├── agents/
│   └── analyst-agent/
│       └── workflow-match.eval.ts
├── online-scorer/
│   └── todos.ts
├── steps/
│   └── todos/
│       ├── scorers.ts
│       └── todos-general-expected.eval.ts
└── workflows/
    ├── analyst-workflow-general.eval.ts
    └── analyst-workflow-redo.eval.private.ts
```

#### **Evaluation Philosophy**

**Evaluations** (`.eval.ts` files):
- Use Braintrust for LLM performance evaluation
- Test actual LLM response quality and correctness
- Use LLM-as-Judge patterns for scoring
- Include datasets for consistent evaluation
- Focus on: "Does the LLM produce good results?"

**Key Distinction**: 
- **Tests** verify the system works (data flows, schemas, execution)
- **Evaluations** verify the LLM produces quality outputs

## Multi-Agent Workflow Patterns

### Example: Analyst Workflow

The analyst workflow demonstrates the multi-agent pattern:

1. **Parallel Initial Steps**: `generateChatTitleStep`, `extractValuesSearchStep`, `createTodosStep`
2. **Think and Prep Agent**: Processes initial analysis
3. **Conditional Branching**: Only runs analyst agent if needed
4. **Message History Passing**: Critical for agent-to-agent communication

#### Message History Flow

```typescript
// In think-and-prep-step.ts
conversationHistory = extractMessageHistory(step.response.messages);

// In analyst-step.ts  
const formattedMessages = formatMessagesForAnalyst(
  inputData.conversationHistory,
  initialPrompt
);
```

**Key Pattern**: Message history from one agent becomes input to the next agent, preserving conversation context and tool usage.

## Key Development Patterns

### Agent Definition Pattern
```typescript
export const agentName = new Agent({
  name: 'Agent Name',
  instructions: getInstructions,
  model: Sonnet4,  // Can use Sonnet4, Haiku35, or anthropicCachedModel('model-id')
  tools: { tool1, tool2, tool3 },
  memory: getSharedMemory(),
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});
```

### Tool Definition Pattern
```typescript
const inputSchema = z.object({
  param: z.string().describe('Parameter description')
});

const outputSchema = z.object({
  result: z.string()
});

const executeFunction = wrapTraced(
  async (params) => {
    // Tool logic here
  },
  { name: 'tool-name' }
);

export const toolName = createTool({
  id: 'tool-id',
  description: 'Tool description for agent understanding',
  inputSchema,
  outputSchema,
  execute: executeFunction,
});
```

### Step Definition Pattern
```typescript
const inputSchema = z.object({
  // Input from previous steps
});

const outputSchema = z.object({
  // Output for next steps
});

const execution = async ({ inputData, getInitData, runtimeContext }) => {
  // Step logic with agent execution
  // Extract message history for multi-agent workflows
  // Return structured output
};

export const stepName = createStep({
  id: 'step-id',
  description: 'Step description',
  inputSchema,
  outputSchema,
  execute: execution,
});
```

### Workflow Definition Pattern
```typescript
const workflow = createWorkflow({
  id: 'workflow-id',
  inputSchema,
  outputSchema,
  steps: [step1, step2, step3],
})
  .parallel([step1, step2, step3])
  .then(step4)
  .branch([
    [condition, step5],
  ])
  .commit();
```

### Message History
- Critical for multi-agent workflows
- Extracted via `extractMessageHistory()` from step responses
- Formatted via `formatMessagesForAnalyst()` for agent consumption
- Preserves tool calls and results between agents

### Runtime Context
- Passes workflow-specific data between steps
- Type-safe with interfaces like `AnalystRuntimeContext`
- Includes user/thread/organization identifiers

## Best Practices

1. **Tool Organization**: Group tools by functional category
2. **Schema Validation**: Always use Zod schemas for input/output
3. **Observability**: Wrap functions with `wrapTraced()` for monitoring
4. **Message Passing**: Use structured message history for multi-agent workflows
5. **Testing Strategy**: Unit tests for logic, integration tests for flow, evaluations for quality
6. **Memory Management**: Use shared memory for conversation persistence
7. **Error Handling**: Graceful handling with user-friendly error messages
8. **Type Safety**: Leverage TypeScript with strict configuration

## Environment Variables

Required environment variables:
- `BRAINTRUST_KEY`: For observability and evaluations
- `ANTHROPIC_API_KEY`: For Claude model access
- Additional keys for specific tools (database connections, etc.)

## Conversation History Management

### Overview

The AI package supports multi-turn conversations by managing conversation history through the database. This enables workflows to maintain context across multiple interactions.

### Key Components

#### Chat History Utilities (`src/steps/get-chat-history.ts`)

Provides functions for retrieving conversation history:

```typescript
// Get all messages with metadata for a chat
getChatHistory(chatId: string): Promise<ChatHistoryResult[]>

// Get just the raw LLM messages for a chat
getRawLlmMessages(chatId: string): Promise<MessageHistory[]>

// Get raw LLM messages for a specific message ID
getRawLlmMessagesByMessageId(messageId: string): Promise<MessageHistory | null>
```

#### Database Integration

The chat history utilities use the `@buster/database` helpers for clean separation of concerns:
- Database operations stay in the database package
- Type validation and transformation happen in the AI package

### Conversation History Flow

#### 1. Initial Message with Database Save

```typescript
// First run - with messageId for database persistence
const messageId = await createTestMessage(chatId, userId);
const runtimeContext = new RuntimeContext();
runtimeContext.set('messageId', messageId);

const result = await analystWorkflow.createRun().start({
  inputData: { prompt: "Initial question" },
  runtimeContext,
});

// Conversation history is automatically saved to database
```

#### 2. Retrieving Conversation History

```typescript
// Fetch the conversation history from the database
import { getRawLlmMessagesByMessageId } from '@buster/ai';

const conversationHistory = await getRawLlmMessagesByMessageId(messageId);
// Returns: CoreMessage[] or null
```

#### 3. Follow-up with History

```typescript
// Second run - with conversation history
const followUpResult = await analystWorkflow.createRun().start({
  inputData: {
    prompt: "Follow-up question",
    conversationHistory: conversationHistory as CoreMessage[],
  },
  runtimeContext,
});
```

### Testing Conversation History

See `tests/workflows/integration/analyst-workflow.int.test.ts` for examples:

```typescript
test('conversation history flow', async () => {
  // 1. Create initial message
  const { chatId, userId } = await createTestChat();
  const messageId = await createTestMessage(chatId, userId);
  
  // 2. Run workflow with messageId
  const runtimeContext = new RuntimeContext();
  runtimeContext.set('messageId', messageId);
  
  const firstRun = await workflow.start({
    inputData: { prompt: "First question" },
    runtimeContext,
  });
  
  // 3. Retrieve conversation history
  const history = await getRawLlmMessagesByMessageId(messageId);
  
  // 4. Run follow-up with history
  const secondRun = await workflow.start({
    inputData: {
      prompt: "Follow-up question",
      conversationHistory: history as CoreMessage[],
    },
    runtimeContext,
  });
});
```

### Best Practices

1. **Use MessageId for Persistence**: Always provide a `messageId` in runtime context when you want to save conversation history
2. **Type Safety**: Cast retrieved history to `CoreMessage[]` after validation
3. **Handle Null Cases**: Check if history exists before using it
4. **Test Both Paths**: Test workflows both with and without conversation history

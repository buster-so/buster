# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

This package implements AI agents and tools using the Mastra framework, integrated with observability through Braintrust.

### Core Components

1. **Agents** (`src/agents/`)
   - Agents are AI assistants with specific instructions and tool access
   - Use Anthropic's Claude models wrapped with Braintrust for observability
   - Include memory persistence via LibSQLStore
   - Example: `weather-agent.ts` uses the `weatherTool` to provide weather information

2. **Tools** (`src/tools/`)
   - Reusable functions that agents can call
   - Created using `createTool` from Mastra
   - Include input/output schema validation with Zod
   - Wrapped with Braintrust's `wrapTraced` for monitoring
   - Example: `weather-tool.ts` fetches weather data from Open-Meteo API

3. **Workflows** (`src/workflows/`)
   - Orchestrate complex multi-step processes (if needed)

### Key Patterns

- **Model Configuration**: Models are wrapped with `wrapAISDKModel` from Braintrust for automatic logging
- **Tool Tracing**: Tool executions use `wrapTraced` to track performance and usage
- **Memory Storage**: Agents use LibSQLStore with relative paths to `.mastra/output` directory
- **Environment Variables**: Required API keys include `BRAINTRUST_KEY` and `OPENAI_API_KEY`

### Testing Strategy

Tests are organized into three categories:
- **Unit Tests**: Test individual tool functionality and schemas
- **Integration Tests**: Test agent behavior end-to-end with tool integration
- **Evaluation Tests**: LLM-as-Judge evaluations for quality metrics (answer relevancy, helpfulness, safety, etc.)

Test configuration includes appropriate timeouts for LLM calls (30-60s) and uses Vitest with custom setup files.

### TypeScript Configuration

- Strict mode enabled with additional safety checks
- Path aliases configured: `@/*`, `@tools/*`, `@agents/*`, `@workflows/*`
- Module resolution set to "bundler" with ESNext target
- No emit mode (type checking only)
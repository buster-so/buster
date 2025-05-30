# Create Plan Straightforward Tool Implementation Plan

## Overview

Migrate the Rust `create_plan_straightforward.rs` to TypeScript using Mastra framework. This tool creates actionable plans for analytical workflows and generates TODO lists.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/planning_tools/create_plan_straightforward.rs`
- **Purpose**: Create structured plans for data analysis tasks and generate actionable TODOs
- **Input**: Plan text (markdown formatted)
- **Output**: Success status and formatted TODO list
- **Key Features**:
  - LLM-based TODO generation from plans
  - Agent state management (plan_available, todos)
  - Integration with helper functions for TODO parsing
  - Braintrust prompt integration

## Dependencies
- @ai-sdk/openai for LLM integration
- @mastra/core for tool framework
- Braintrust for tracing and prompt management

## Implementation Pattern
**Type**: Agent-based
**Wave**: 2
**AI Agent Time**: 3 minutes
**Depends on**: None (foundational planning tool)

## TypeScript Implementation

### Tool Definition

```typescript
export const createPlanStraightforwardTool = createTool({
  id: 'create-plan-straightforward',
  description: 'Create a clear and actionable plan for analytical workflows',
  inputSchema: z.object({
    plan: z.string().describe('The step-by-step plan in markdown format')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    todos: z.string().describe('Formatted TODO list generated from the plan')
  }),
  execute: async ({ context }) => {
    return await createPlanStraightforward(context);
  },
});
```

### Dependencies Required

```typescript
import { LiteLLMClient } from '@litellm/client';
import { BraintrustClient } from '@braintrust/client';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
```

### Core Implementation

```typescript
interface CreatePlanStraightforwardParams {
  plan: string;
}

interface TodoItem {
  todo: string;
  order: number;
  completed: boolean;
}

const createPlanStraightforward = wrapTraced(
  async (params: CreatePlanStraightforwardParams) => {
    const { plan } = params;
    
    // Set agent state to indicate plan is available
    await agent.setState('plan_available', true);
    
    let todosString = '';
    
    try {
      // Generate TODOs from the plan using LLM
      const todosStateObjects = await generateTodosFromPlan(
        plan,
        agent.getUserId(),
        agent.getSessionId()
      );
      
      // Format TODOs as checklist
      const formattedTodos = todosStateObjects
        .filter(obj => obj.todo)
        .map(obj => `[ ] ${obj.todo}`)
        .join('\n');
        
      todosString = formattedTodos;
      
      // Store TODOs in agent state
      await agent.setState('todos', todosStateObjects);
      
    } catch (error) {
      console.warn(
        `Failed to generate todos from plan using LLM: ${error.message}. Proceeding without todos.`
      );
      
      // Set empty todos array on failure
      await agent.setState('todos', []);
    }
    
    return {
      success: true,
      todos: todosString
    };
  },
  { name: 'create-plan-straightforward' }
);
```

### TODO Generation Helper

```typescript
async function generateTodosFromPlan(
  plan: string,
  userId: string,
  sessionId: string
): Promise<TodoItem[]> {
  const llmClient = new LiteLLMClient();
  
  const prompt = await getTodoGenerationPrompt();
  
  const messages = [
    {
      role: 'system' as const,
      content: prompt
    },
    {
      role: 'user' as const,
      content: `Plan to convert to TODOs:\n\n${plan}`
    }
  ];
  
  const response = await llmClient.chatCompletion({
    model: 'gemini-2.0-flash-001',
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.0,
    metadata: {
      generation_name: 'generate_todos_from_plan',
      user_id: userId,
      session_id: sessionId,
      trace_id: crypto.randomUUID()
    }
  });
  
  const result = JSON.parse(response.choices[0].message.content);
  
  // Validate and structure the response
  return result.todos.map((todo: any, index: number) => ({
    todo: typeof todo === 'string' ? todo : todo.todo || '',
    order: index + 1,
    completed: false
  }));
}

async function getTodoGenerationPrompt(): Promise<string> {
  // Try to get prompt from Braintrust if configured
  if (process.env.USE_BRAINTRUST_PROMPTS === 'true') {
    try {
      const braintrustClient = new BraintrustClient({
        apiKey: process.env.BRAINTRUST_API_KEY,
        projectId: process.env.BRAINTRUST_PROJECT_ID
      });
      
      const prompt = await braintrustClient.getPrompt('todo-generation-prompt');
      return prompt.content;
    } catch (error) {
      console.warn('Failed to fetch prompt from Braintrust:', error);
    }
  }
  
  // Fallback to default prompt
  return DEFAULT_TODO_GENERATION_PROMPT;
}

const DEFAULT_TODO_GENERATION_PROMPT = `
You are a task breakdown specialist. Your job is to convert analytical plans into actionable TODO items.

Given a plan for data analysis or visualization work, extract specific, actionable tasks that need to be completed.

Rules for TODO extraction:
1. Each TODO should be a single, concrete action
2. TODOs should be ordered logically
3. Include both technical tasks (create visualizations, query data) and validation tasks (review results)
4. Be specific about what needs to be created (e.g., "Create bar chart showing monthly sales" not "Create chart")
5. Include verification and review steps
6. Maximum 15 TODOs per plan

Return your response as a JSON object with this structure:
{
  "todos": [
    "First actionable task",
    "Second actionable task",
    ...
  ]
}

Focus on tasks that can be executed by an AI agent with access to data tools.
`;
```

### Schema Validation

```typescript
const TodoItemSchema = z.object({
  todo: z.string(),
  order: z.number(),
  completed: z.boolean()
});

const TodosArraySchema = z.array(TodoItemSchema);

// Validate generated TODOs
function validateTodos(todos: any[]): TodoItem[] {
  try {
    return TodosArraySchema.parse(todos);
  } catch (error) {
    console.warn('Generated TODOs failed validation:', error);
    // Return empty array if validation fails
    return [];
  }
}
```

### Plan Template Integration

```typescript
async function getPlanStraightforwardDescription(): Promise<string> {
  if (process.env.USE_BRAINTRUST_PROMPTS === 'true') {
    try {
      const braintrustClient = new BraintrustClient({
        apiKey: process.env.BRAINTRUST_API_KEY
      });
      
      const description = await braintrustClient.getPrompt('plan-straightforward-description');
      return description.content;
    } catch (error) {
      console.warn('Failed to get description from Braintrust:', error);
    }
  }
  
  return 'Use this template to create a clear and actionable plan tailored to the user\'s request.';
}

// The plan template would be stored as a separate constant or fetched from Braintrust
const PLAN_STRAIGHTFORWARD_TEMPLATE = `
Use this template to create a clear and actionable plan tailored to the user's request.
Ensure the final plan output is well-formatted with markdown for readability.

**Thought**  
Analyze the user's request and the conversation history. Outline your approach...

**Step-by-Step Plan**  
1. **Create [number] visualization(s)**:
   - **Title**: [Simple title for the visualization]
   - **Type**: [e.g., Bar Chart, Line Chart, Number Card]
   - **Datasets**: [Relevant datasets]
   - **Expected Output**: [Describe the visualization]

2. **Create dashboard** (if multiple visualizations):
   Specify how visualizations should be organized

3. **Review & Finish**:
   Verify visualizations display correctly and meet user's request

**Notes** (Optional)  
Add context, assumptions, or limitations
`;
```

## Test Strategy

### Unit Tests (`create-plan-straightforward.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- TODO generation from plans
- Agent state management
- LLM integration failures
- Plan template processing

### Integration Tests (`create-plan-straightforward.integration.test.ts`)
- Real database/filesystem/API integration
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- Braintrust prompt integration
- Agent state persistence

## Implementation Dependencies

### New TypeScript Packages

```json
{
  "dependencies": {
    "@braintrust/client": "^1.0.0",
    "crypto": "node built-in"
  }
}
```

### Missing from TypeScript

1. **Agent State Management**: Need to implement agent state persistence
2. **Braintrust Integration**: Need TypeScript client for prompt management
3. **TODO Management**: Need structured TODO state management

## AI Agent Implementation Time

**Estimated Time**: 3 minutes
**Complexity**: Medium

## Implementation Priority

**High** - Core planning functionality that drives analytical workflows.

## Notes

- Plan templates should be externalized and configurable
- TODO validation is critical for downstream workflow reliability
- Consider adding plan versioning and history
- Integration with project management tools could be valuable
- Should support different plan types (straightforward vs investigative)
- Error handling for LLM failures is essential
- Consider adding plan quality scoring and validation
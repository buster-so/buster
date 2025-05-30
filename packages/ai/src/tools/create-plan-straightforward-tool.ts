import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

interface CreatePlanStraightforwardParams {
  plan: string;
}

interface TodoItem {
  todo: string;
  order: number;
  completed: boolean;
}

interface CreatePlanStraightforwardResult {
  success: boolean;
  todos: string;
}

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
    return await createPlanStraightforward(context as CreatePlanStraightforwardParams);
  },
});

const createPlanStraightforward = wrapTraced(
  async (params: CreatePlanStraightforwardParams): Promise<CreatePlanStraightforwardResult> => {
    const { plan } = params;
    
    if (!plan || plan.trim() === '') {
      throw new Error('Plan cannot be empty');
    }
    
    let todosString = '';
    
    try {
      // Generate TODOs from the plan using LLM
      const todosStateObjects = await generateTodosFromPlan(plan);
      
      // Format TODOs as checklist
      const formattedTodos = todosStateObjects
        .filter(obj => obj.todo && obj.todo.trim() !== '')
        .map(obj => `[ ] ${obj.todo}`)
        .join('\n');
        
      todosString = formattedTodos;
      
    } catch (error) {
      console.warn(
        `Failed to generate todos from plan using LLM: ${error instanceof Error ? error.message : String(error)}. Proceeding without todos.`
      );
      
      todosString = '';
    }
    
    return {
      success: true,
      todos: todosString
    };
  },
  { name: 'create-plan-straightforward' }
);

async function generateTodosFromPlan(plan: string): Promise<TodoItem[]> {
  const prompt = getTodoGenerationPrompt();
  
  try {
    const result = await generateText({
      model: openai('gpt-4'),
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: `Plan to convert to TODOs:\n\n${plan}`
        }
      ],
      temperature: 0.0,
      maxTokens: 2000,
    });
    
    // Parse the JSON response
    const parsed = JSON.parse(result.text);
    
    // Validate and structure the response
    if (!parsed.todos || !Array.isArray(parsed.todos)) {
      throw new Error('Invalid response format: missing todos array');
    }
    
    return parsed.todos.map((todo: any, index: number): TodoItem => ({
      todo: typeof todo === 'string' ? todo : todo.todo || '',
      order: index + 1,
      completed: false
    }));
    
  } catch (error) {
    console.warn('Failed to parse LLM response for TODO generation:', error);
    
    // Fallback: extract simple todos from plan text
    return extractTodosFromPlanText(plan);
  }
}

function extractTodosFromPlanText(plan: string): TodoItem[] {
  const lines = plan.split('\n');
  const todos: TodoItem[] = [];
  let order = 1;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Look for numbered items, bullet points, or action words - be more selective
    if (
      /^\d+\.\s+/.test(trimmed) || // 1. Create... (with space after number)
      /^[-*]\s+/.test(trimmed) ||  // - Create... or * Create... (with space)
      /^(create|build|implement|add|setup|configure|test|deploy|verify)\s+/i.test(trimmed) // Action words with space
    ) {
      // Clean up the line to make it a proper todo
      let todoText = trimmed
        .replace(/^\d+\.\s*/, '') // Remove "1. "
        .replace(/^[-*]\s*/, '')  // Remove "- " or "* "
        .trim();
        
      // More conservative filtering
      if (todoText.length > 5 && todoText.length < 150 && !todoText.includes('##') && !todoText.includes('**')) {
        todos.push({
          todo: todoText,
          order: order++,
          completed: false
        });
        
        // Stop early if we have enough todos
        if (todos.length >= 12) {
          break;
        }
      }
    }
  }
  
  // If no todos found, create a generic one
  if (todos.length === 0) {
    todos.push({
      todo: 'Review and execute the provided plan',
      order: 1,
      completed: false
    });
  }
  
  return todos.slice(0, 12); // Limit to 12 todos max to be safe
}

function getTodoGenerationPrompt(): string {
  return `
You are a task breakdown specialist. Your job is to convert analytical plans into actionable TODO items.

Given a plan for data analysis or visualization work, extract specific, actionable tasks that need to be completed.

Rules for TODO extraction:
1. Each TODO should be a single, concrete action
2. TODOs should be ordered logically
3. Include both technical tasks (create visualizations, query data) and validation tasks (review results)
4. Be specific about what needs to be created (e.g., "Create bar chart showing monthly sales" not "Create chart")
5. Include verification and review steps
6. Maximum 15 TODOs per plan
7. Focus on tasks that can be executed by an AI agent with access to data tools
8. Use active voice and start with action verbs (Create, Build, Query, Analyze, etc.)

Return your response as a JSON object with this structure:
{
  "todos": [
    "First actionable task",
    "Second actionable task",
    "Third actionable task"
  ]
}

Example input: "Create a dashboard showing user engagement metrics with charts for daily active users and session duration."

Example output:
{
  "todos": [
    "Query user engagement data from the database",
    "Create line chart showing daily active users over time",
    "Create histogram showing session duration distribution", 
    "Build dashboard layout with proper spacing and titles",
    "Add date range filters to the dashboard",
    "Test dashboard functionality and data accuracy",
    "Review dashboard with stakeholders for feedback"
  ]
}
`;
}

// Schema validation for future use
export const TodoItemSchema = z.object({
  todo: z.string(),
  order: z.number(),
  completed: z.boolean()
});

export const TodosArraySchema = z.array(TodoItemSchema);
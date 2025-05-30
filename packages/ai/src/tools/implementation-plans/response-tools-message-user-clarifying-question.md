# Message User Clarifying Question Tool Implementation Plan

## Overview

Migrate the Rust `message_user_clarifying_question.rs` to TypeScript using Mastra framework. This tool allows agents to ask clarifying questions when requirements are unclear.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/response_tools/message_user_clarifying_question.rs`
- **Purpose**: Request clarification from users for ambiguous requirements
- **Input**: Question text, context, options
- **Output**: Question status and formatting
- **Key Features**:
  - Question formatting
  - Context preservation
  - Multiple choice support
  - Conversation flow management

## TypeScript Implementation

### Tool Definition

```typescript
export const messageUserClarifyingQuestionTool = createTool({
  id: 'message-user-clarifying-question',
  description: 'Ask the user a clarifying question when requirements are unclear',
  inputSchema: z.object({
    question: z.string().describe('The clarifying question to ask'),
    context: z.string().optional()
      .describe('Additional context explaining why clarification is needed'),
    options: z.array(z.object({
      value: z.string(),
      label: z.string(),
      description: z.string().optional()
    })).optional()
      .describe('Multiple choice options if applicable'),
    question_type: z.enum(['open_ended', 'multiple_choice', 'yes_no', 'confirmation'])
      .default('open_ended'),
    priority: z.enum(['high', 'medium', 'low']).default('medium'),
    related_to: z.string().optional()
      .describe('What aspect of the task this question relates to')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message_sent: z.boolean(),
    formatted_question: z.string(),
    requires_response: z.boolean(),
    conversation_paused: z.boolean()
  }),
  execute: async ({ context }) => {
    return await sendClarifyingQuestion(context);
  },
});
```

### Core Implementation

```typescript
interface ClarifyingQuestionParams {
  question: string;
  context?: string;
  options?: QuestionOption[];
  question_type: QuestionType;
  priority: Priority;
  related_to?: string;
}

interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

type QuestionType = 'open_ended' | 'multiple_choice' | 'yes_no' | 'confirmation';
type Priority = 'high' | 'medium' | 'low';

const sendClarifyingQuestion = wrapTraced(
  async (params: ClarifyingQuestionParams) => {
    const {
      question,
      context,
      options,
      question_type,
      priority,
      related_to
    } = params;
    
    // Format the question based on type
    const formattedQuestion = formatQuestion({
      question,
      context,
      options,
      question_type,
      priority,
      related_to
    });
    
    // Store question in conversation state
    await storeQuestionInState({
      question: formattedQuestion,
      type: question_type,
      timestamp: new Date().toISOString(),
      awaiting_response: true
    });
    
    // Pause workflow execution
    await agent.setState('workflow_paused', true);
    await agent.setState('pause_reason', 'awaiting_clarification');
    
    // Mark conversation as requiring user input
    await agent.setState('requires_user_input', true);
    
    return {
      success: true,
      message_sent: true,
      formatted_question: formattedQuestion,
      requires_response: true,
      conversation_paused: true
    };
  },
  { name: 'message-user-clarifying-question' }
);

function formatQuestion(params: {
  question: string;
  context?: string;
  options?: QuestionOption[];
  question_type: QuestionType;
  priority: Priority;
  related_to?: string;
}): string {
  let formatted = '';
  
  // Add priority indicator for high priority
  if (params.priority === 'high') {
    formatted += '🔴 **Important Clarification Needed**\n\n';
  }
  
  // Add context if provided
  if (params.context) {
    formatted += `*Context: ${params.context}*\n\n`;
  }
  
  // Add the question
  formatted += params.question;
  
  // Format based on question type
  switch (params.question_type) {
    case 'multiple_choice':
      if (params.options && params.options.length > 0) {
        formatted += '\n\nPlease select one of the following options:\n';
        params.options.forEach((option, index) => {
          formatted += `\n${index + 1}. **${option.label}**`;
          if (option.description) {
            formatted += `\n   ${option.description}`;
          }
        });
      }
      break;
      
    case 'yes_no':
      formatted += '\n\nPlease respond with **Yes** or **No**.';
      break;
      
    case 'confirmation':
      formatted += '\n\nPlease confirm by typing **Confirm** or provide an alternative.';
      break;
      
    case 'open_ended':
    default:
      // No special formatting for open-ended questions
      break;
  }
  
  // Add related context
  if (params.related_to) {
    formatted += `\n\n*This question is related to: ${params.related_to}*`;
  }
  
  return formatted;
}

async function storeQuestionInState(questionData: {
  question: string;
  type: QuestionType;
  timestamp: string;
  awaiting_response: boolean;
}) {
  // Get existing clarification history
  const history = await agent.getState('clarification_history') || [];
  
  // Add new question
  history.push({
    ...questionData,
    id: generateQuestionId(),
    response: null
  });
  
  await agent.setState('clarification_history', history);
  await agent.setState('latest_clarification_request', questionData);
}

function generateQuestionId(): string {
  return `clarify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper tool to process clarification responses
export const processClarificationResponseTool = createTool({
  id: 'process-clarification-response',
  description: 'Process user response to a clarifying question',
  inputSchema: z.object({
    response: z.string().describe('User response to the clarifying question'),
    question_id: z.string().optional().describe('ID of the question being answered')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    response_processed: z.boolean(),
    workflow_resumed: z.boolean(),
    validation_result: z.object({
      valid: z.boolean(),
      error_message: z.string().optional()
    }).optional()
  }),
  execute: async ({ context }) => {
    return await processClarificationResponse(context);
  }
});

async function processClarificationResponse(params: {
  response: string;
  question_id?: string;
}) {
  const { response, question_id } = params;
  
  // Get the latest clarification request
  const latestRequest = await agent.getState('latest_clarification_request');
  
  if (!latestRequest) {
    throw new Error('No pending clarification request found');
  }
  
  // Validate response based on question type
  const validation = validateResponse(response, latestRequest.type);
  
  if (!validation.valid) {
    return {
      success: false,
      response_processed: false,
      workflow_resumed: false,
      validation_result: validation
    };
  }
  
  // Store response in history
  const history = await agent.getState('clarification_history') || [];
  const questionIndex = history.findIndex(q => 
    q.id === question_id || q === history[history.length - 1]
  );
  
  if (questionIndex >= 0) {
    history[questionIndex].response = response;
    history[questionIndex].response_timestamp = new Date().toISOString();
    history[questionIndex].awaiting_response = false;
  }
  
  await agent.setState('clarification_history', history);
  
  // Process the response based on type
  await processResponseByType(response, latestRequest.type);
  
  // Resume workflow
  await agent.setState('workflow_paused', false);
  await agent.setState('requires_user_input', false);
  await agent.setState('latest_clarification_response', response);
  
  return {
    success: true,
    response_processed: true,
    workflow_resumed: true,
    validation_result: validation
  };
}

function validateResponse(
  response: string,
  questionType: QuestionType
): { valid: boolean; error_message?: string } {
  switch (questionType) {
    case 'yes_no':
      const yesNoResponse = response.toLowerCase().trim();
      if (!['yes', 'no', 'y', 'n'].includes(yesNoResponse)) {
        return {
          valid: false,
          error_message: 'Please respond with Yes or No'
        };
      }
      break;
      
    case 'confirmation':
      const confirmResponse = response.toLowerCase().trim();
      if (!confirmResponse.includes('confirm') && response.length < 5) {
        return {
          valid: false,
          error_message: 'Please type "Confirm" or provide an alternative'
        };
      }
      break;
      
    case 'multiple_choice':
      // Validate if response matches one of the options
      // This would need access to the original options
      break;
  }
  
  return { valid: true };
}

async function processResponseByType(response: string, questionType: QuestionType) {
  switch (questionType) {
    case 'yes_no':
      const isYes = ['yes', 'y'].includes(response.toLowerCase().trim());
      await agent.setState('clarification_yes_no_response', isYes);
      break;
      
    case 'confirmation':
      const isConfirmed = response.toLowerCase().includes('confirm');
      await agent.setState('clarification_confirmed', isConfirmed);
      if (!isConfirmed) {
        await agent.setState('clarification_alternative', response);
      }
      break;
      
    default:
      // Store raw response for other types
      await agent.setState('clarification_response', response);
  }
}

// Utility to check if clarification is needed
export function shouldAskClarification(context: {
  ambiguity_score: number;
  missing_requirements: string[];
  confidence_level: number;
}): boolean {
  const { ambiguity_score, missing_requirements, confidence_level } = context;
  
  // High ambiguity
  if (ambiguity_score > 0.7) return true;
  
  // Missing critical requirements
  if (missing_requirements.length > 0) return true;
  
  // Low confidence
  if (confidence_level < 0.5) return true;
  
  return false;
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('MessageUserClarifyingQuestionTool', () => {
  test('formats open-ended question correctly', async () => {
    const result = await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Which time period would you like to analyze?',
        context: 'Multiple time periods are available in the data',
        question_type: 'open_ended'
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.formatted_question).toContain('Which time period');
    expect(result.formatted_question).toContain('Context:');
    expect(result.conversation_paused).toBe(true);
  });
  
  test('formats multiple choice question with options', async () => {
    const result = await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Which metric would you like to focus on?',
        question_type: 'multiple_choice',
        options: [
          { value: 'revenue', label: 'Revenue', description: 'Total sales revenue' },
          { value: 'profit', label: 'Profit', description: 'Net profit after costs' },
          { value: 'volume', label: 'Volume', description: 'Number of units sold' }
        ]
      }
    });
    
    expect(result.formatted_question).toContain('1. **Revenue**');
    expect(result.formatted_question).toContain('Total sales revenue');
  });
  
  test('handles high priority questions', async () => {
    const result = await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Please confirm before proceeding with data deletion',
        question_type: 'confirmation',
        priority: 'high'
      }
    });
    
    expect(result.formatted_question).toContain('🔴 **Important Clarification Needed**');
    expect(result.formatted_question).toContain('Confirm');
  });
});

describe('ProcessClarificationResponseTool', () => {
  test('validates yes/no responses', async () => {
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Should I include historical data?',
        question_type: 'yes_no'
      }
    });
    
    const result = await processClarificationResponseTool.execute({
      context: { response: 'Yes' }
    });
    
    expect(result.success).toBe(true);
    expect(result.workflow_resumed).toBe(true);
  });
  
  test('rejects invalid yes/no response', async () => {
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Should I proceed?',
        question_type: 'yes_no'
      }
    });
    
    const result = await processClarificationResponseTool.execute({
      context: { response: 'Maybe' }
    });
    
    expect(result.success).toBe(false);
    expect(result.validation_result?.error_message).toContain('Yes or No');
  });
});
```

## Implementation Priority

**Medium** - Important for user interaction but not critical path.

## Estimated Complexity

**Low-Medium** - Straightforward message formatting and state management.

## 1000x Speed Implementation Time

**15 minutes** - Simple question formatting and response handling.
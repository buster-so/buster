import type { Sandbox } from '@buster/sandbox';
import type { DocsAgentContext } from '../../../context/docs-agent-context';

export interface CreateTestContextOptions {
  sandbox: Sandbox;
  dataSourceId?: string;
  todoList?: string[];
  clarificationQuestions?: Array<{
    issue: string;
    context: string;
    clarificationQuestion: string;
  }>;
}

/**
 * Creates a test DocsAgentContext with sensible defaults
 */
export function createTestContext(options: CreateTestContextOptions): DocsAgentContext {
  const {
    sandbox,
    dataSourceId = '550e8400-e29b-41d4-a716-446655440000', // Valid UUID v4
    todoList = [],
    clarificationQuestions = [],
  } = options;

  return {
    sandbox,
    todoList: todoList.join('\n'),
    clarificationQuestions,
    dataSourceId,
  };
}

/**
 * Creates a context with pre-populated todos for testing
 */
export function createContextWithTodos(sandbox: Sandbox): DocsAgentContext {
  return createTestContext({
    sandbox,
    todoList: [
      'Document the staging models in models/staging/stripe/',
      'Add descriptions to all columns in fct_mrr model',
      'Create README for the finance mart',
      'Update main project README with setup instructions',
    ],
  });
}

/**
 * Creates a context with clarification questions
 */
export function createContextWithClarifications(sandbox: Sandbox): DocsAgentContext {
  return createTestContext({
    sandbox,
    clarificationQuestions: [
      {
        issue: 'Missing column documentation',
        context: 'The stg_stripe__customers model has columns without descriptions',
        clarificationQuestion:
          'What does the "delinquent" column represent in the customers table?',
      },
      {
        issue: 'Unclear business logic',
        context: 'The MRR calculation in fct_mrr uses complex logic',
        clarificationQuestion:
          'Should MRR include customers in trial status or only active paying customers?',
      },
    ],
  });
}

/**
 * Creates a context simulating a partially completed workflow
 */
export function createPartiallyCompletedContext(sandbox: Sandbox): DocsAgentContext {
  return createTestContext({
    sandbox,
    todoList: [
      'Document the staging models in models/staging/stripe/', // Completed
      'Add descriptions to all columns in fct_mrr model',
      'Create README for the finance mart', // Completed
      'Update main project README with setup instructions',
    ],
  });
}

/**
 * Creates test inputs for the workflow
 */
export interface CreateTestInputOptions {
  message?: string;
  organizationId?: string;
  context: DocsAgentContext;
}

export function createTestWorkflowInput(options: CreateTestInputOptions) {
  const {
    message = 'Please document all the models in this dbt project',
    organizationId = 'test-org-123',
    context,
  } = options;

  return {
    message,
    organizationId,
    context,
  };
}

/**
 * Common test messages for different scenarios
 */
export const TEST_MESSAGES = {
  documentAll: 'Please document all the models in 4_marts/1_common models please',
  documentSpecific: 'Please create a simple documentation file for the fct_mrr model.',
  updateReadme: 'Update the README files to include setup instructions',
  addTests: 'Add schema tests for all staging models',
  fixYaml: 'Fix any malformed YAML files in the project',
  askClarification: 'Document the project but I need clarification on business logic',
  completePartial: 'Continue documenting from where we left off',
};

/**
 * Helper to validate workflow output
 */
export function validateWorkflowOutput(output: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Type guard to check if output is an object
  if (!output || typeof output !== 'object') {
    errors.push('Output must be an object');
    return { isValid: false, errors };
  }

  const outputObj = output as Record<string, unknown>;

  // Check for required fields based on the output type
  if (outputObj.clarificationNeeded) {
    if (!outputObj.clarificationQuestion) {
      errors.push('clarificationQuestion is required when clarificationNeeded is true');
    }
    const clarificationQuestion = outputObj.clarificationQuestion as Record<string, unknown>;
    if (clarificationQuestion) {
      if (!clarificationQuestion.issue) {
        errors.push('clarificationQuestion.issue is required');
      }
      if (!clarificationQuestion.context) {
        errors.push('clarificationQuestion.context is required');
      }
      if (!clarificationQuestion.clarificationQuestion) {
        errors.push('clarificationQuestion.clarificationQuestion is required');
      }
    }
  }

  if (outputObj.documentationCreated) {
    const metadata = outputObj.metadata as Record<string, unknown>;
    if (metadata && typeof metadata.filesCreated !== 'number') {
      errors.push('metadata.filesCreated should be a number when documentation is created');
    }
  }

  if (outputObj.todos && !Array.isArray(outputObj.todos)) {
    errors.push('todos should be an array');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

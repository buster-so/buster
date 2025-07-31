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
  documentAll: `Hey Buster,

I need your help documenting our dbt project for the first time. To prepare for this, I've created template .yml files for each dbt model that needs documentation, run queries and commands to retrieve standard metadata about the project, warehouse, tables, and columns, added that metadata to .json files in the \`busterMetadata\` folder, and created the \`needs_clarification.md\` file.

## Task Overview
Your primary objective is to thoroughly document the dbt project by creating and updating documentation files (.yml and .md) based on the repository structure, metadata, and guidelines in your system prompt. This is the initial documentation pass, so focus on building a strong foundation: explore the repo, generate an overview, identify and verify relationships, classify columns, define tables and columns, log clarifications, and finalize with a pull request. Work iteratively using your agent loop—think, act with tools, reflect, and check off TODO items—while validating assumptions with evidence from metadata .json files, .sql files, and lightweight SQL queries where needed. Prioritize core entities (e.g., users, orders) before dependents, and revisit/update documentation as new insights emerge.

## Detailed Workflow
Follow this step-by-step workflow to complete the documentation. Always validate with data (e.g., referential integrity checks) and reference your system prompt's guidelines for YAML structure, classifications, definitions, etc.

1. **Explore the Repository and Update the Overview File**
   - Start by thoroughly exploring the repo to get your bearings: read key files and reference lineage info from .json metadata to understand dependencies and prioritize core entities before dependents.
   - Update my \`overview.md\` as if it were a robust README:
     - Describe the company/business (you can search the internet for additional context if needed, e.g., company background, products/offerings, etc).
     - Outline key data concepts: Entities (e.g., core tables like users, orders), metrics (e.g., revenue, churn), and high-level relationships.
   - Ensure the overview is comprehensive and saved before proceeding.

2. **Identify, Verify, and Document Joins & Relationships**
   - Be extremely thorough: Use the four tactics below to comprehensively map relationships across all of our dbt models. Document only verified relationships in the 'relationships' section of each relevant .yml file (bidirectionally where appropriate), following the YAML structure (e.g., specify name, source_col, ref_col, description, cardinality, type).
   - Tactics:
     - **From Historic Queries**: Pull historic queries, if available (e.g., \`SELECT query_text FROM account_usage.query_history WHERE query_text LIKE '%JOIN%' AND execution_status = 'SUCCESS' LIMIT 1000;\`). Analyze for common joins between models, then verify each individually with referential integrity checks (e.g., \`SELECT COUNT(*) FROM <foreign_table> WHERE <fk_col> NOT IN (SELECT <pk_col> FROM <primary_table>);\`—expect 0) and match percentage (e.g., \`SELECT (SELECT COUNT(*) FROM <foreign_table> JOIN <primary_table> ON <fk_col> = <pk_col>) * 100.0 / COUNT(*) FROM <foreign_table>;\`—a high % (e.g. >95%) can suggest a valid relationship\`).
     - **From Keywords**: Use \`grepSearch\` or \`readFiles\` to identify columns with names like "id", "pk", "fk". Check for primary keys via uniqueness (e.g., \`SELECT <col>, COUNT(*) FROM <table> GROUP BY <col> HAVING COUNT(*) > 1;\` or approximate \`SELECT APPROX_COUNT_DISTINCT(<col>), COUNT(*) FROM <table>;\`). For each potential PK-FK pair, verify with the above integrity and match queries.
     - **Self-Referential Relationships**: Check for FKs referencing the same table's PK (e.g., employees.manager_id → employees.employee_id). Verify with queries like \`SELECT COUNT(*) FROM <table> e WHERE NOT EXISTS (SELECT 1 FROM <table> m WHERE e.<fk_col> = m.<pk_col>) AND e.<fk_col> IS NOT NULL;\`.
     - **Junction Tables/Many-to-Many**: Identify tables with multiple FKs, verify each link with integrity/match queries as above.
   - If a relationship is unclear (e.g., low match %), log it in \`needs_clarification.md\` instead of documenting. 
   - Update .yml files with their relationships before proceeding to the next step.

3. **Classify Columns as Stored Value or ENUM**
   - Go table by table, and reference .json metadata (e.g., data type, distinct count, samples) and .sql files to understand each column.
     - Identify if any of the table's columns should be classified as "Stored Value" columns
     - Identify if any of the table's columns should be classified as "ENUM" columns
   - Update the classifications in each .yml file as you go (prior to generating table/column definitions); do this model-by-model.

4. **Generate Table Definitions**
   - Work one table at a time, starting with core entities. 
   - For each model's .yml file, provide a detailed explanation in the description field
   - Reference .json metadata to enrich (e.g., stats, lineage). 
   - Before moving on to the next table, interpret the description from the perspective a new analyst to ensure it's self-sufficient.
   - Save updates; revisit and edit if new context emerges
   - Do not skip any models - ensure all model descriptions are thoroughly documented.

5. **Generate Column Definitions**
   - After all table definitions are done, go model-by-model. 
   - Reference the model's metadata file to understand each column and plan out what each column (dimension/measure/metric/filter/etc) description should be
     - In the 'description' field: Explain content/meaning, calculation (if derived from .sql), value patterns (e.g., range/formats from metadata/samples), units, analytical utility, caveats (e.g., nulls), and query examples.
     - Include classifications from step 3, and note if it's a key (referencing relationships).
     - Fill out all keys related to each column as well (e.g. type, args, etc as applicable)
     - Ensure clarity for new analysts before proceeding to the next model.
     - Do not skip any models or columns - ensure all columns across all models are thoroughly documented.

6. **Identify and Log Points Needing Clarification**
   - After completing the above, assess the full documentation for important gaps. 
   - Log important items that need clarification from the senior members of the data team
   - Helpful exercises:
     - Impersonate a first-day data analyst: What’s missing/confusing?
     - Impersonate a user with common data requests: Which data requests can’t be answered confidently due to unclear docs?
     - Spot unclear utility in key concepts, or similar fields/tables without distinctions (e.g., guidelines for usage).
   - Be thorough in your search/assessment and highly strategic in the clarifications you choose to log.
   - Your goal is to identify and log important items that need clarification, but to avoid completely overwhelming the data team with low-impact clarfication requests.

7. **Finalize and Create a Pull Request**
   - Review all changes: Review files and your work to validate completeness.
   - Stage, commit, and push changes
   - Create a PR

## Additional Guidelines
- Always reference your system prompt for specifics (e.g., YAML structure, various guidelines, prioritize metadata over queries, etc).
- Iterate: Re-read files if context is lost; update docs and make commits iteratively and frequently.
- Focus on analyst-friendly docs: Clear, concise, comprehensive with brief but meaningful context.

Thanks for your help with this!`,
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

# Create Plan Investigative Tool Implementation Plan

## Overview

Migrate the Rust `create_plan_investigative.rs` to TypeScript using Mastra framework. This tool creates detailed investigative plans for complex analytical tasks requiring exploration.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/planning_tools/create_plan_investigative.rs`
- **Purpose**: Create exploratory plans when requirements are unclear
- **Input**: Initial plan outline with investigation steps
- **Output**: Structured investigative plan with discovery phases
- **Key Features**:
  - Hypothesis generation
  - Data discovery steps
  - Iterative refinement
  - Question generation
  - Exploration tracking

## Dependencies
- @mastra/core/workflows for orchestration
- @ai-sdk/openai for plan generation
- @mastra/core for tool framework
- Braintrust for tracing and prompt management

## Implementation Pattern
**Type**: Workflow-based
**Wave**: 4
**AI Agent Time**: 4 minutes
**Depends on**: search-data-catalog, create-plan-straightforward

## TypeScript Implementation

### Tool Definition

```typescript
export const createPlanInvestigativeTool = createTool({
  id: 'create-plan-investigative',
  description: 'Create investigative plans for complex analytical tasks requiring exploration',
  inputSchema: z.object({
    plan: z.string().describe('The investigative plan in markdown format'),
    investigation_type: z.enum(['data_discovery', 'hypothesis_testing', 'root_cause', 'exploratory'])
      .default('exploratory'),
    hypotheses: z.array(z.string()).optional()
      .describe('Initial hypotheses to investigate'),
    key_questions: z.array(z.string()).optional()
      .describe('Key questions to answer'),
    data_sources_to_explore: z.array(z.string()).optional()
      .describe('Specific data sources to investigate')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    investigation_phases: z.array(z.object({
      phase: z.string(),
      description: z.string(),
      steps: z.array(z.string()),
      expected_outcomes: z.array(z.string())
    })),
    todos: z.string(),
    estimated_iterations: z.number()
  }),
  execute: async ({ context }) => {
    return await executeInvestigativeWorkflow(context);
  },
});
```

### Workflow-Based Implementation (Recommended)

This tool benefits from Mastra workflows for multi-phase planning and LLM chaining:

```typescript
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';

// Create planning agent
const investigativePlanningAgent = new Agent({
  name: 'InvestigativePlanningAgent',
  model: openai('gpt-4o'),
  instructions: 'You are an expert at creating investigative analytical plans. Break down complex problems into systematic investigation phases.'
});

// Define workflow steps
const parsePhaseStep = createStep({
  id: 'parse-investigation-phases',
  description: 'Parse plan into structured investigation phases',
  inputSchema: z.object({
    plan: z.string(),
    investigationType: z.string()
  }),
  outputSchema: z.object({
    phases: z.array(z.object({
      name: z.string(),
      description: z.string(),
      steps: z.array(z.string()),
      expected_outcomes: z.array(z.string())
    }))
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent('InvestigativePlanningAgent');
    
    const prompt = getPhaseParsingPrompt(inputData.investigationType, inputData.plan);
    
    const response = await agent.generate([
      { role: 'user', content: prompt }
    ], { output: 'json' });
    
    return JSON.parse(response.choices[0].message.content);
  }
});

const enhancePhaseStep = createStep({
  id: 'enhance-phases',
  description: 'Enhance phases based on investigation context',
  inputSchema: z.object({
    phases: z.array(z.any()),
    context: z.object({
      investigation_type: z.string(),
      hypotheses: z.array(z.string()).optional(),
      key_questions: z.array(z.string()).optional(),
      data_sources_to_explore: z.array(z.string()).optional()
    })
  }),
  outputSchema: z.object({
    enhancedPhases: z.array(z.object({
      phase: z.string(),
      description: z.string(), 
      steps: z.array(z.string()),
      expected_outcomes: z.array(z.string())
    }))
  }),
  execute: async ({ inputData }) => {
    const enhancedPhases = await enhancePhases(inputData.phases, inputData.context);
    return { enhancedPhases };
  }
});

const generateTodosStep = createStep({
  id: 'generate-todos',
  description: 'Generate actionable TODOs from investigation phases',
  inputSchema: z.object({
    phases: z.array(z.any())
  }),
  outputSchema: z.object({
    todos: z.array(z.object({
      todo: z.string(),
      order: z.number(),
      completed: z.boolean(),
      phase: z.string().optional()
    })),
    formatted: z.string()
  }),
  execute: async ({ inputData }) => {
    return await generateInvestigativeTodos(inputData.phases);
  }
});

// Create investigative planning workflow
const investigativeWorkflow = createWorkflow({
  id: 'create-investigative-plan-workflow',
  inputSchema: z.object({
    plan: z.string(),
    investigation_type: z.enum(['data_discovery', 'hypothesis_testing', 'root_cause', 'exploratory']),
    hypotheses: z.array(z.string()).optional(),
    key_questions: z.array(z.string()).optional(),
    data_sources_to_explore: z.array(z.string()).optional()
  }),
  steps: []
})
.then(parsePhaseStep.withInput(({ inputData }) => ({
  plan: inputData.plan,
  investigationType: inputData.investigation_type
})))
.then(enhancePhaseStep.withInput(({ inputData, responses }) => ({
  phases: responses['parse-investigation-phases'].phases,
  context: {
    investigation_type: inputData.investigation_type,
    hypotheses: inputData.hypotheses,
    key_questions: inputData.key_questions,
    data_sources_to_explore: inputData.data_sources_to_explore
  }
})))
.then(generateTodosStep.withInput(({ responses }) => ({
  phases: responses['enhance-phases'].enhancedPhases
})))
.then({
  id: 'finalize-plan',
  description: 'Finalize investigative plan and set agent state',
  execute: async ({ inputData, responses }) => {
    const enhancedPhases = responses['enhance-phases'].enhancedPhases;
    const todosResult = responses['generate-todos'];
    
    // Set agent state for investigative mode
    await agent.setState('plan_available', true);
    await agent.setState('investigation_mode', true);
    await agent.setState('investigation_type', inputData.investigation_type);
    await agent.setState('investigation_phases', enhancedPhases);
    await agent.setState('todos', todosResult.todos);
    await agent.setState('current_phase', 0);
    
    return {
      success: true,
      investigation_phases: enhancedPhases,
      todos: todosResult.formatted,
      estimated_iterations: estimateIterations(enhancedPhases)
    };
  }
})
.commit();

async function executeInvestigativeWorkflow(params: InvestigativePlanParams) {
  return await investigativeWorkflow.execute(params);
}
```

### Alternative Simple Implementation

```typescript
interface InvestigativePlanParams {
  plan: string;
  investigation_type: InvestigationType;
  hypotheses?: string[];
  key_questions?: string[];
  data_sources_to_explore?: string[];
}

type InvestigationType = 'data_discovery' | 'hypothesis_testing' | 'root_cause' | 'exploratory';

const createInvestigativePlan = wrapTraced(
  async (params: InvestigativePlanParams) => {
    const { plan, investigation_type, hypotheses, key_questions, data_sources_to_explore } = params;
    
    // Set agent state for investigative mode
    await agent.setState('plan_available', true);
    await agent.setState('investigation_mode', true);
    await agent.setState('investigation_type', investigation_type);
    
    // Parse plan into investigation phases
    const phases = await parseInvestigationPhases(plan, investigation_type);
    
    // Enhance phases with specific investigation strategies
    const enhancedPhases = await enhancePhases(phases, {
      hypotheses,
      key_questions,
      data_sources_to_explore,
      investigation_type
    });
    
    // Generate detailed TODOs from phases
    const todosResult = await generateInvestigativeTodos(enhancedPhases);
    
    // Store investigation state
    await agent.setState('investigation_phases', enhancedPhases);
    await agent.setState('todos', todosResult.todos);
    await agent.setState('current_phase', 0);
    
    return {
      success: true,
      investigation_phases: enhancedPhases,
      todos: todosResult.formatted,
      estimated_iterations: estimateIterations(enhancedPhases)
    };
  },
  { name: 'create-plan-investigative' }
);

async function parseInvestigationPhases(
  plan: string,
  investigationType: InvestigationType
): Promise<InvestigationPhase[]> {
  const llmClient = new LiteLLMClient();
  
  const prompt = getPhaseParsingPrompt(investigationType);
  
  const response = await llmClient.chatCompletion({
    model: 'gemini-2.0-flash-001',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: plan }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.0
  });
  
  const result = JSON.parse(response.choices[0].message.content);
  
  return result.phases.map((phase: any) => ({
    phase: phase.name,
    description: phase.description,
    steps: phase.steps || [],
    expected_outcomes: phase.expected_outcomes || []
  }));
}

async function enhancePhases(
  phases: InvestigationPhase[],
  context: InvestigationContext
): Promise<InvestigationPhase[]> {
  const enhancedPhases = [...phases];
  
  switch (context.investigation_type) {
    case 'data_discovery':
      enhancedPhases.unshift({
        phase: 'Data Catalog Exploration',
        description: 'Discover available data sources and understand data landscape',
        steps: [
          'Search data catalog for relevant datasets',
          'Identify key entities and relationships',
          'Map data source dependencies',
          'Document data quality observations'
        ],
        expected_outcomes: [
          'List of relevant datasets',
          'Understanding of data relationships',
          'Initial data quality assessment'
        ]
      });
      break;
      
    case 'hypothesis_testing':
      if (context.hypotheses && context.hypotheses.length > 0) {
        enhancedPhases.unshift({
          phase: 'Hypothesis Formulation',
          description: 'Formalize hypotheses and define testing criteria',
          steps: context.hypotheses.map(h => `Test hypothesis: ${h}`),
          expected_outcomes: [
            'Clear hypothesis statements',
            'Defined success/failure criteria',
            'Required data identified'
          ]
        });
      }
      break;
      
    case 'root_cause':
      enhancedPhases.unshift({
        phase: 'Problem Definition',
        description: 'Clearly define the problem and its symptoms',
        steps: [
          'Document observed symptoms',
          'Identify affected metrics/KPIs',
          'Establish timeline of events',
          'List potential contributing factors'
        ],
        expected_outcomes: [
          'Clear problem statement',
          'Timeline of events',
          'Initial factor analysis'
        ]
      });
      break;
      
    case 'exploratory':
      if (context.key_questions && context.key_questions.length > 0) {
        enhancedPhases.unshift({
          phase: 'Question Mapping',
          description: 'Map key questions to data exploration paths',
          steps: context.key_questions.map(q => `Explore: ${q}`),
          expected_outcomes: [
            'Question-to-data mapping',
            'Exploration priorities',
            'Initial insights'
          ]
        });
      }
      break;
  }
  
  // Add iterative refinement phase at the end
  enhancedPhases.push({
    phase: 'Synthesis and Iteration',
    description: 'Synthesize findings and identify next steps',
    steps: [
      'Compile findings from all phases',
      'Identify gaps in analysis',
      'Generate follow-up questions',
      'Recommend next iterations if needed'
    ],
    expected_outcomes: [
      'Comprehensive findings summary',
      'Identified knowledge gaps',
      'Recommendations for further investigation'
    ]
  });
  
  return enhancedPhases;
}

async function generateInvestigativeTodos(
  phases: InvestigationPhase[]
): Promise<{ todos: TodoItem[]; formatted: string }> {
  const todos: TodoItem[] = [];
  let order = 1;
  
  for (const phase of phases) {
    // Add phase header TODO
    todos.push({
      todo: `--- ${phase.phase} ---`,
      order: order++,
      completed: false,
      is_phase_header: true
    });
    
    // Add steps as TODOs
    for (const step of phase.steps) {
      todos.push({
        todo: step,
        order: order++,
        completed: false,
        phase: phase.phase
      });
    }
    
    // Add checkpoint TODO
    todos.push({
      todo: `Review ${phase.phase} outcomes: ${phase.expected_outcomes.join(', ')}`,
      order: order++,
      completed: false,
      is_checkpoint: true,
      phase: phase.phase
    });
  }
  
  const formatted = todos
    .map(todo => {
      if (todo.is_phase_header) {
        return `\n${todo.todo}\n`;
      }
      return `[ ] ${todo.todo}`;
    })
    .join('\n');
    
  return { todos, formatted };
}

function estimateIterations(phases: InvestigationPhase[]): number {
  // Base iteration count on phase complexity
  let iterations = phases.length;
  
  // Add iterations for phases with many steps
  for (const phase of phases) {
    if (phase.steps.length > 5) {
      iterations += Math.floor(phase.steps.length / 5);
    }
  }
  
  // Investigative plans typically require 2-3 iterations minimum
  return Math.max(iterations, 3);
}

function getPhaseParsingPrompt(investigationType: InvestigationType): string {
  const basePrompt = `
You are an expert at parsing investigative analytical plans into structured phases.
Extract distinct investigation phases from the provided plan.

For ${investigationType} investigations, focus on:
`;

  const typeSpecific = {
    data_discovery: `
- Data source identification phases
- Schema exploration steps
- Relationship mapping activities
- Data quality assessment steps`,
    
    hypothesis_testing: `
- Hypothesis formulation
- Data collection for testing
- Statistical analysis steps
- Result interpretation phases`,
    
    root_cause: `
- Problem symptom documentation
- Timeline construction
- Factor analysis phases
- Causation testing steps`,
    
    exploratory: `
- Initial exploration phases
- Pattern discovery steps
- Insight generation activities
- Deep-dive investigations`
  };

  return basePrompt + typeSpecific[investigationType] + `

Return a JSON object with this structure:
{
  "phases": [
    {
      "name": "Phase name",
      "description": "What this phase accomplishes",
      "steps": ["Step 1", "Step 2", ...],
      "expected_outcomes": ["Outcome 1", "Outcome 2", ...]
    }
  ]
}`;
}

// Helper to track investigation progress
export const trackInvestigationProgressTool = createTool({
  id: 'track-investigation-progress',
  description: 'Track progress through investigation phases',
  inputSchema: z.object({
    completed_phase: z.string().optional(),
    findings: z.array(z.string()).optional(),
    new_questions: z.array(z.string()).optional(),
    next_phase: z.string().optional()
  }),
  outputSchema: z.object({
    current_phase: z.number(),
    total_phases: z.number(),
    completion_percentage: z.number(),
    should_iterate: z.boolean()
  }),
  execute: async ({ context }) => {
    const phases = await agent.getState('investigation_phases') || [];
    const currentPhase = await agent.getState('current_phase') || 0;
    
    if (context.completed_phase) {
      await agent.setState('current_phase', currentPhase + 1);
    }
    
    if (context.findings) {
      await agent.appendState('investigation_findings', context.findings);
    }
    
    if (context.new_questions) {
      await agent.appendState('follow_up_questions', context.new_questions);
    }
    
    const completion = ((currentPhase + 1) / phases.length) * 100;
    const shouldIterate = context.new_questions && context.new_questions.length > 3;
    
    return {
      current_phase: currentPhase + 1,
      total_phases: phases.length,
      completion_percentage: completion,
      should_iterate: shouldIterate
    };
  }
});
```

## Test Strategy

### Unit Tests (`create-plan-investigative.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- Investigation phase generation
- Hypothesis validation
- TODO generation from phases
- Plan type differentiation

### Integration Tests (`create-plan-investigative.integration.test.ts`)
- Real database/filesystem/API integration
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- Complex investigation workflows
- Multi-phase execution testing

## AI Agent Implementation Time

**Estimated Time**: 4 minutes
**Complexity**: Medium-High

## Implementation Priority

**High** - Critical for complex analytical workflows.
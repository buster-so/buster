import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

interface InvestigativePlanParams {
  plan: string;
  investigation_type: InvestigationType;
  hypotheses?: string[];
  key_questions?: string[];
  data_sources_to_explore?: string[];
}

interface InvestigationPhase {
  phase: string;
  description: string;
  steps: string[];
  expected_outcomes: string[];
}

interface TodoItem {
  todo: string;
  order: number;
  completed: boolean;
  phase?: string;
  is_phase_header?: boolean;
  is_checkpoint?: boolean;
}

interface InvestigationContext {
  investigation_type: InvestigationType;
  hypotheses?: string[];
  key_questions?: string[];
  data_sources_to_explore?: string[];
}

type InvestigationType = 'data_discovery' | 'hypothesis_testing' | 'root_cause' | 'exploratory';

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
    return await createInvestigativePlan(context as InvestigativePlanParams);
  },
});

const createInvestigativePlan = wrapTraced(
  async (params: InvestigativePlanParams) => {
    const { plan, investigation_type, hypotheses, key_questions, data_sources_to_explore } = params;
    
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
  const prompt = getPhaseParsingPrompt(investigationType, plan);
  
  try {
    const result = await generateText({
      model: openai('gpt-4'),
      messages: [
        {
          role: 'system',
          content: 'You are an expert at parsing investigative analytical plans into structured phases.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.0,
      maxTokens: 2000
    });
    
    const parsed = JSON.parse(result.text);
    
    if (!parsed.phases || !Array.isArray(parsed.phases)) {
      throw new Error('Invalid response format: missing phases array');
    }
    
    return parsed.phases.map((phase: any) => ({
      phase: phase.name || phase.phase,
      description: phase.description,
      steps: phase.steps || [],
      expected_outcomes: phase.expected_outcomes || []
    }));
  } catch (error) {
    console.warn('LLM phase parsing failed, using fallback:', error);
    return extractPhasesFromPlanText(plan, investigationType);
  }
}

function extractPhasesFromPlanText(
  plan: string,
  investigationType: InvestigationType
): InvestigationPhase[] {
  const lines = plan.split('\n');
  const phases: InvestigationPhase[] = [];
  let currentPhase: Partial<InvestigationPhase> | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Look for phase headers (headings)
    if (/^#+\s+/.test(trimmed)) {
      if (currentPhase && currentPhase.phase) {
        phases.push(currentPhase as InvestigationPhase);
      }
      
      currentPhase = {
        phase: trimmed.replace(/^#+\s+/, ''),
        description: '',
        steps: [],
        expected_outcomes: []
      };
    }
    // Look for numbered steps
    else if (/^\d+\.\s+/.test(trimmed) && currentPhase) {
      const step = trimmed.replace(/^\d+\.\s*/, '');
      currentPhase.steps = currentPhase.steps || [];
      currentPhase.steps.push(step);
    }
    // Look for bullet points
    else if (/^[-*]\s+/.test(trimmed) && currentPhase) {
      const step = trimmed.replace(/^[-*]\s*/, '');
      currentPhase.steps = currentPhase.steps || [];
      currentPhase.steps.push(step);
    }
    // Description text
    else if (trimmed && !currentPhase?.description && currentPhase) {
      currentPhase.description = trimmed;
    }
  }
  
  // Add the last phase
  if (currentPhase && currentPhase.phase) {
    phases.push(currentPhase as InvestigationPhase);
  }
  
  // If no phases found, create default phases based on investigation type
  if (phases.length === 0) {
    return getDefaultPhases(investigationType);
  }
  
  return phases;
}

function getDefaultPhases(investigationType: InvestigationType): InvestigationPhase[] {
  const defaultPhases: Record<InvestigationType, InvestigationPhase[]> = {
    data_discovery: [
      {
        phase: 'Data Exploration',
        description: 'Explore available data sources and understand data landscape',
        steps: ['Search data catalog', 'Identify key datasets', 'Analyze data schemas'],
        expected_outcomes: ['List of relevant datasets', 'Understanding of data structure']
      },
      {
        phase: 'Initial Analysis',
        description: 'Perform preliminary analysis on discovered data',
        steps: ['Load sample data', 'Identify patterns', 'Document findings'],
        expected_outcomes: ['Initial insights', 'Data quality assessment']
      }
    ],
    hypothesis_testing: [
      {
        phase: 'Hypothesis Formulation',
        description: 'Define clear testable hypotheses',
        steps: ['Document hypotheses', 'Define success criteria', 'Identify required data'],
        expected_outcomes: ['Clear hypothesis statements', 'Testing methodology']
      },
      {
        phase: 'Data Collection',
        description: 'Gather data needed for hypothesis testing',
        steps: ['Query relevant datasets', 'Validate data quality', 'Prepare analysis datasets'],
        expected_outcomes: ['Clean testing datasets', 'Data validation results']
      }
    ],
    root_cause: [
      {
        phase: 'Problem Definition',
        description: 'Clearly define the problem and its symptoms',
        steps: ['Document symptoms', 'Establish timeline', 'Identify affected areas'],
        expected_outcomes: ['Clear problem statement', 'Timeline of events']
      },
      {
        phase: 'Factor Analysis',
        description: 'Analyze potential contributing factors',
        steps: ['List potential causes', 'Analyze correlations', 'Test factor impact'],
        expected_outcomes: ['Ranked list of factors', 'Impact analysis']
      }
    ],
    exploratory: [
      {
        phase: 'Initial Exploration',
        description: 'Begin exploratory analysis of the problem space',
        steps: ['Define key questions', 'Explore data sources', 'Generate initial insights'],
        expected_outcomes: ['Refined questions', 'Initial findings']
      },
      {
        phase: 'Deep Dive Analysis',
        description: 'Conduct detailed analysis based on initial findings',
        steps: ['Focus on interesting patterns', 'Create detailed visualizations', 'Test findings'],
        expected_outcomes: ['Detailed insights', 'Validated patterns']
      }
    ]
  };
  
  return defaultPhases[investigationType];
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

function getPhaseParsingPrompt(investigationType: InvestigationType, plan: string): string {
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

Plan to parse:
${plan}

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
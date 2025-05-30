# Review Plan Tool Implementation Plan

## Overview

Migrate the Rust `review_plan.rs` to TypeScript using Mastra framework. This tool reviews and validates generated plans for completeness and quality.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/planning_tools/review_plan.rs`
- **Purpose**: Review and validate analytical plans before execution
- **Input**: Plan content, review criteria
- **Output**: Review results with suggestions
- **Key Features**:
  - Plan completeness checking
  - Quality assessment
  - Missing step identification
  - Improvement suggestions
  - Risk assessment

## Dependencies
- @ai-sdk/openai for LLM-based analysis
- @mastra/core for tool framework
- Braintrust for tracing

## Implementation Pattern
**Type**: Agent-based
**Wave**: 3
**AI Agent Time**: 3 minutes
**Depends on**: create-plan-straightforward, create-plan-investigative

## TypeScript Implementation

### Tool Definition

```typescript
export const reviewPlanTool = createTool({
  id: 'review-plan',
  description: 'Review and validate analytical plans for completeness and quality',
  inputSchema: z.object({
    plan: z.string().describe('The plan to review'),
    plan_type: z.enum(['straightforward', 'investigative']).default('straightforward'),
    review_criteria: z.array(z.string()).optional()
      .describe('Specific criteria to evaluate'),
    user_requirements: z.string().optional()
      .describe('Original user requirements for validation'),
    existing_resources: z.object({
      available_datasets: z.array(z.string()).optional(),
      available_metrics: z.array(z.string()).optional(),
      time_constraints: z.string().optional()
    }).optional()
  }),
  outputSchema: z.object({
    overall_score: z.number().min(0).max(100),
    completeness_score: z.number().min(0).max(100),
    clarity_score: z.number().min(0).max(100),
    feasibility_score: z.number().min(0).max(100),
    issues: z.array(z.object({
      severity: z.enum(['critical', 'warning', 'suggestion']),
      category: z.string(),
      description: z.string(),
      recommendation: z.string()
    })),
    missing_elements: z.array(z.string()),
    improvement_suggestions: z.array(z.string()),
    risk_assessment: z.object({
      level: z.enum(['low', 'medium', 'high']),
      factors: z.array(z.string())
    }),
    approved: z.boolean()
  }),
  execute: async ({ context }) => {
    return await reviewPlan(context);
  },
});
```

### Core Implementation

```typescript
interface ReviewPlanParams {
  plan: string;
  plan_type: 'straightforward' | 'investigative';
  review_criteria?: string[];
  user_requirements?: string;
  existing_resources?: {
    available_datasets?: string[];
    available_metrics?: string[];
    time_constraints?: string;
  };
}

const reviewPlan = wrapTraced(
  async (params: ReviewPlanParams) => {
    const { plan, plan_type, review_criteria, user_requirements, existing_resources } = params;
    
    // Perform multi-dimensional review
    const reviews = await Promise.all([
      reviewCompleteness(plan, plan_type, user_requirements),
      reviewClarity(plan),
      reviewFeasibility(plan, existing_resources),
      reviewCustomCriteria(plan, review_criteria)
    ]);
    
    const [completeness, clarity, feasibility, customReview] = reviews;
    
    // Aggregate issues and suggestions
    const allIssues = [
      ...completeness.issues,
      ...clarity.issues,
      ...feasibility.issues,
      ...customReview.issues
    ];
    
    const missingElements = identifyMissingElements(plan, plan_type);
    const improvements = generateImprovements(allIssues, plan);
    const riskAssessment = assessRisks(allIssues, feasibility);
    
    // Calculate overall score
    const overallScore = calculateOverallScore({
      completeness: completeness.score,
      clarity: clarity.score,
      feasibility: feasibility.score
    });
    
    // Determine approval
    const hasCriticalIssues = allIssues.some(issue => issue.severity === 'critical');
    const approved = overallScore >= 70 && !hasCriticalIssues;
    
    return {
      overall_score: overallScore,
      completeness_score: completeness.score,
      clarity_score: clarity.score,
      feasibility_score: feasibility.score,
      issues: allIssues,
      missing_elements: missingElements,
      improvement_suggestions: improvements,
      risk_assessment: riskAssessment,
      approved
    };
  },
  { name: 'review-plan' }
);

async function reviewCompleteness(
  plan: string,
  planType: string,
  userRequirements?: string
): Promise<ReviewResult> {
  const requiredElements = getRequiredElements(planType);
  const planElements = extractPlanElements(plan);
  
  const issues: Issue[] = [];
  let score = 100;
  
  // Check for required elements
  for (const element of requiredElements) {
    if (!planElements.has(element)) {
      issues.push({
        severity: 'critical',
        category: 'completeness',
        description: `Missing required element: ${element}`,
        recommendation: `Add ${element} to the plan`
      });
      score -= 20;
    }
  }
  
  // Check alignment with user requirements
  if (userRequirements) {
    const alignmentCheck = await checkRequirementsAlignment(plan, userRequirements);
    if (!alignmentCheck.aligned) {
      issues.push({
        severity: 'warning',
        category: 'completeness',
        description: 'Plan may not fully address user requirements',
        recommendation: alignmentCheck.suggestion
      });
      score -= 10;
    }
  }
  
  return {
    score: Math.max(0, score),
    issues
  };
}

async function reviewClarity(plan: string): Promise<ReviewResult> {
  const issues: Issue[] = [];
  let score = 100;
  
  // Check for clear structure
  const sections = plan.split(/\n\n+/);
  if (sections.length < 3) {
    issues.push({
      severity: 'warning',
      category: 'clarity',
      description: 'Plan lacks clear section separation',
      recommendation: 'Use clear headings and separate sections with blank lines'
    });
    score -= 15;
  }
  
  // Check for actionable steps
  const actionableSteps = plan.match(/^\d+\.\s+\w+/gm) || [];
  if (actionableSteps.length < 2) {
    issues.push({
      severity: 'warning',
      category: 'clarity',
      description: 'Plan lacks numbered actionable steps',
      recommendation: 'Include numbered steps with clear actions'
    });
    score -= 20;
  }
  
  // Check for ambiguous language
  const ambiguousTerms = ['maybe', 'possibly', 'might', 'could', 'should consider'];
  const ambiguousCount = ambiguousTerms.reduce((count, term) => 
    count + (plan.toLowerCase().match(new RegExp(term, 'g')) || []).length, 0
  );
  
  if (ambiguousCount > 3) {
    issues.push({
      severity: 'suggestion',
      category: 'clarity',
      description: 'Plan contains ambiguous language',
      recommendation: 'Use definitive language and clear commitments'
    });
    score -= 10;
  }
  
  return {
    score: Math.max(0, score),
    issues
  };
}

async function reviewFeasibility(
  plan: string,
  resources?: any
): Promise<ReviewResult> {
  const issues: Issue[] = [];
  let score = 100;
  
  if (!resources) {
    return { score: 80, issues: [{
      severity: 'suggestion',
      category: 'feasibility',
      description: 'No resource constraints provided for feasibility check',
      recommendation: 'Provide available resources for better feasibility assessment'
    }] };
  }
  
  // Check dataset availability
  if (resources.available_datasets) {
    const requiredDatasets = extractRequiredDatasets(plan);
    const missingDatasets = requiredDatasets.filter(ds => 
      !resources.available_datasets!.includes(ds)
    );
    
    if (missingDatasets.length > 0) {
      issues.push({
        severity: 'critical',
        category: 'feasibility',
        description: `Plan requires unavailable datasets: ${missingDatasets.join(', ')}`,
        recommendation: 'Modify plan to use available datasets or request access'
      });
      score -= 30;
    }
  }
  
  // Check complexity vs time constraints
  if (resources.time_constraints) {
    const estimatedTime = estimatePlanExecutionTime(plan);
    const availableTime = parseTimeConstraint(resources.time_constraints);
    
    if (estimatedTime > availableTime) {
      issues.push({
        severity: 'warning',
        category: 'feasibility',
        description: 'Plan complexity exceeds time constraints',
        recommendation: 'Simplify plan or adjust timeline expectations'
      });
      score -= 20;
    }
  }
  
  return {
    score: Math.max(0, score),
    issues
  };
}

async function reviewCustomCriteria(
  plan: string,
  criteria?: string[]
): Promise<ReviewResult> {
  if (!criteria || criteria.length === 0) {
    return { score: 100, issues: [] };
  }
  
  const llmClient = new LiteLLMClient();
  
  const prompt = `
Review the following plan against these specific criteria:
${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Plan:
${plan}

For each criterion, assess if the plan meets it and provide specific feedback.
Return a JSON object with this structure:
{
  "criteria_results": [
    {
      "criterion": "criterion text",
      "met": true/false,
      "feedback": "specific feedback"
    }
  ]
}
`;

  const response = await llmClient.chatCompletion({
    model: 'gemini-2.0-flash-001',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.0
  });
  
  const result = JSON.parse(response.choices[0].message.content);
  
  const issues: Issue[] = [];
  let score = 100;
  
  for (const criterionResult of result.criteria_results) {
    if (!criterionResult.met) {
      issues.push({
        severity: 'warning',
        category: 'custom_criteria',
        description: `Criterion not met: ${criterionResult.criterion}`,
        recommendation: criterionResult.feedback
      });
      score -= (100 / criteria.length);
    }
  }
  
  return {
    score: Math.max(0, score),
    issues
  };
}

function identifyMissingElements(plan: string, planType: string): string[] {
  const requiredElements = getRequiredElements(planType);
  const missing: string[] = [];
  
  for (const element of requiredElements) {
    if (!plan.toLowerCase().includes(element.toLowerCase())) {
      missing.push(element);
    }
  }
  
  return missing;
}

function generateImprovements(issues: Issue[], plan: string): string[] {
  const improvements: string[] = [];
  
  // Group issues by category
  const issuesByCategory = issues.reduce((acc, issue) => {
    if (!acc[issue.category]) acc[issue.category] = [];
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<string, Issue[]>);
  
  // Generate category-specific improvements
  if (issuesByCategory.completeness) {
    improvements.push('Add missing required elements to ensure comprehensive coverage');
  }
  
  if (issuesByCategory.clarity) {
    improvements.push('Restructure plan with clear sections and numbered steps');
  }
  
  if (issuesByCategory.feasibility) {
    improvements.push('Adjust scope to match available resources and constraints');
  }
  
  // Add specific high-priority improvements
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  criticalIssues.forEach(issue => {
    improvements.push(issue.recommendation);
  });
  
  return [...new Set(improvements)]; // Remove duplicates
}

function assessRisks(issues: Issue[], feasibility: ReviewResult): RiskAssessment {
  const factors: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  
  if (criticalCount > 0) {
    riskLevel = 'high';
    factors.push(`${criticalCount} critical issues identified`);
  } else if (warningCount > 2) {
    riskLevel = 'medium';
    factors.push(`${warningCount} warnings need attention`);
  }
  
  if (feasibility.score < 60) {
    riskLevel = 'high';
    factors.push('Low feasibility score indicates execution challenges');
  }
  
  return {
    level: riskLevel,
    factors
  };
}

function calculateOverallScore(scores: {
  completeness: number;
  clarity: number;
  feasibility: number;
}): number {
  // Weighted average with emphasis on completeness
  return Math.round(
    (scores.completeness * 0.4) +
    (scores.clarity * 0.3) +
    (scores.feasibility * 0.3)
  );
}

function getRequiredElements(planType: string): string[] {
  const common = ['objectives', 'steps', 'expected output'];
  
  if (planType === 'investigative') {
    return [...common, 'hypotheses', 'data sources', 'iteration plan'];
  }
  
  return [...common, 'datasets', 'visualizations', 'timeline'];
}

// Helper interfaces
interface ReviewResult {
  score: number;
  issues: Issue[];
}

interface Issue {
  severity: 'critical' | 'warning' | 'suggestion';
  category: string;
  description: string;
  recommendation: string;
}

interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  factors: string[];
}
```

## Test Strategy

### Unit Tests (`review-plan.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- Plan completeness assessment
- Quality scoring algorithms
- Risk assessment logic
- Custom criteria evaluation

### Integration Tests (`review-plan.integration.test.ts`)
- Real database/filesystem/API integration
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- LLM-based plan analysis
- Resource constraint validation

## AI Agent Implementation Time

**Estimated Time**: 3 minutes
**Complexity**: Medium

## Implementation Priority

**Medium** - Important for plan quality but not blocking execution.
# TICKET-002: Agent Tool Name Alignment

**Priority**: 🔴 Critical  
**Estimated Effort**: 1-2 days  
**Dependencies**: None (Can run parallel with TICKET-001)  
**Blocks**: None

## Problem Statement

Agent instructions reference tool names that don't match the actual tool implementations, causing agent confusion and tool call failures.

## Mismatches Found

### Analyst Agent Instructions
- ❌ References: `updateMetrics` → ✅ Actual tool: `modifyMetrics`
- ❌ References: `updateDashboards` → ✅ Actual tool: `modifyDashboards`
- ❌ References: `messageUserClarifyingQuestion` → ✅ Tool doesn't exist (should use `finishAndRespond`)

### Think-and-Prep Agent Instructions  
- ❌ References: `submitThoughtsForReview` → ✅ Actual tool: `submitThoughts`

## Scope

### Files to Modify:
- `src/agents/analyst-agent/analyst-agent-instructions.ts`
- `src/agents/think-and-prep-agent/think-and-prep-instructions.ts`
- `src/agents/analyst-agent/analyst-agent.ts` (verify tool list)
- `src/agents/think-and-prep-agent/think-and-prep-agent.ts` (verify tool list)

### Changes Required:

#### 1. Update Analyst Agent Instructions
```typescript
// Replace all instances of:
"updateMetrics" → "modifyMetrics"
"updateDashboards" → "modifyDashboards"
"messageUserClarifyingQuestion" → "finishAndRespond"
```

#### 2. Update Think-and-Prep Agent Instructions
```typescript
// Replace all instances of:
"submitThoughtsForReview" → "submitThoughts"
```

#### 3. Verify Tool Configurations
Ensure agent tool lists match instruction references:

```typescript
// analyst-agent.ts
tools: {
  createMetrics: createMetricsFileTool,
  modifyMetrics: modifyMetricsFileTool,     // ✅ Correct name
  createDashboards: createDashboardsFileTool,
  modifyDashboards: modifyDashboardsFileTool, // ✅ Correct name
  doneTool,
}

// think-and-prep-agent.ts
tools: {
  sequentialThinking: sequentialThinkingTool,
  executeSql: executeSqlTool,
  finishAndRespond: finishAndRespondTool,
  submitThoughts: submitThoughtsTool,        // ✅ Correct name
}
```

#### 4. Update Instruction Content
Search and replace the following patterns in instruction text:

**Analyst Instructions:**
- "Use the `updateMetrics` tool" → "Use the `modifyMetrics` tool"
- "Call `updateDashboards`" → "Call `modifyDashboards`"  
- "Use `messageUserClarifyingQuestion`" → "Use `finishAndRespond`"

**Think-and-Prep Instructions:**
- "Use `submitThoughtsForReview`" → "Use `submitThoughts`"
- References to "review" workflow → Update to reflect direct submission

## Acceptance Criteria

- [ ] All tool names in instructions match actual tool implementations
- [ ] Agent configurations list only tools referenced in instructions
- [ ] No references to non-existent tools
- [ ] Instruction examples use correct tool names
- [ ] Tool usage patterns are consistent throughout instructions

## Test Plan

- [ ] Agent integration tests pass with corrected tool names
- [ ] Verify agents can successfully call all referenced tools
- [ ] Test workflow execution with corrected instructions
- [ ] Validate tool call logs show correct tool names

## Validation Script

Create a validation script to prevent future mismatches:

```typescript
// scripts/validate-agent-tools.ts
import { analystAgent } from '../src/agents/analyst-agent/analyst-agent';
import { thinkAndPrepAgent } from '../src/agents/think-and-prep-agent/think-and-prep-agent';

function validateToolReferences(agent: Agent, instructionText: string) {
  const availableTools = Object.keys(agent.tools);
  const toolReferences = extractToolReferences(instructionText);
  
  const missingTools = toolReferences.filter(
    tool => !availableTools.includes(tool)
  );
  
  if (missingTools.length > 0) {
    throw new Error(`Missing tools: ${missingTools.join(', ')}`);
  }
}
```

## Notes

This ticket can be completed independently and in parallel with type safety work. It's critical because tool name mismatches cause immediate workflow failures.
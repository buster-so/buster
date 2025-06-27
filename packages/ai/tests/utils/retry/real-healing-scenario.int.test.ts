import { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { thinkAndPrepAgent } from '../../../src/agents/think-and-prep-agent/think-and-prep-agent';
import { retryableAgentStreamWithHealing } from '../../../src/utils/retry';
import type { AnalystRuntimeContext } from '../../../src/workflows/analyst-workflow';

describe('Real-world healing scenario', () => {
  it('should demonstrate healing works when agent naturally tries wrong tool', async () => {
    const messages: CoreMessage[] = [
      {
        role: 'user',
        content: 'Create a dashboard and metrics for analyzing monthly sales trends. Include revenue by product category.'
      }
    ];

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
    runtimeContext.set('chatId', crypto.randomUUID());
    runtimeContext.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
    runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
    runtimeContext.set('dataSourceSyntax', 'postgres');

    const healingLog = {
      attempts: [] as any[],
      toolsCalled: [] as string[],
      finishedSuccessfully: false,
      finalTool: null as string | null,
    };

    const result = await retryableAgentStreamWithHealing({
      agent: thinkAndPrepAgent,
      messages,
      options: {
        toolCallStreaming: true,
        runtimeContext,
        maxSteps: 10, // Allow multiple steps for the agent to recover
      },
      retryConfig: {
        maxRetries: 3,
        onRetry: (error, attempt) => {
          healingLog.attempts.push({
            attempt,
            errorType: error.type,
            toolName: error.originalError?.toolName || 'unknown',
            message: error.healingMessage,
          });
          console.log(`Healing attempt ${attempt}:`, {
            errorType: error.type,
            toolName: error.originalError?.toolName || 'unknown',
          });
        }
      }
    });

    // Process the stream and track what happens
    for await (const chunk of result.stream.fullStream) {
      if (chunk.type === 'tool-call') {
        healingLog.toolsCalled.push(chunk.toolName);
        console.log('Tool called:', chunk.toolName);
      }
      
      if (chunk.type === 'tool-call' && 
          (chunk.toolName === 'submitThoughts' || chunk.toolName === 'respondWithoutAnalysis')) {
        healingLog.finishedSuccessfully = true;
        healingLog.finalTool = chunk.toolName;
      }
    }

    // Log results
    console.log('\n📊 Healing Scenario Results:');
    console.log('   Tools called:', healingLog.toolsCalled);
    console.log('   Healing attempts:', healingLog.attempts.length);
    console.log('   Finished successfully:', healingLog.finishedSuccessfully);
    console.log('   Final tool:', healingLog.finalTool);
    
    // The agent should eventually succeed
    expect(healingLog.finishedSuccessfully).toBe(true);
    expect(['submitThoughts', 'respondWithoutAnalysis']).toContain(healingLog.finalTool);
  });

  it('should track actual agent behavior with dashboard creation prompt', async () => {
    // This test helps us understand what tools the agent naturally tries to use
    const messages: CoreMessage[] = [
      {
        role: 'user',
        content: 'I need you to create metrics and a dashboard for tracking customer satisfaction scores'
      }
    ];

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
    runtimeContext.set('chatId', crypto.randomUUID());
    runtimeContext.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
    runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
    runtimeContext.set('dataSourceSyntax', 'postgres');

    const toolUsage = {
      allTools: [] as string[],
      uniqueTools: new Set<string>(),
    };

    try {
      const result = await retryableAgentStreamWithHealing({
        agent: thinkAndPrepAgent,
        messages,
        options: {
          toolCallStreaming: true,
          runtimeContext,
          maxSteps: 5,
        },
      });

      for await (const chunk of result.stream.fullStream) {
        if (chunk.type === 'tool-call') {
          toolUsage.allTools.push(chunk.toolName);
          toolUsage.uniqueTools.add(chunk.toolName);
        }
      }
    } catch (error) {
      console.log('Error during execution:', error);
    }

    console.log('\n🔧 Tool Usage Analysis:');
    console.log('   All tools called:', toolUsage.allTools);
    console.log('   Unique tools:', Array.from(toolUsage.uniqueTools));
    console.log('   Available tools:', Object.keys(thinkAndPrepAgent.tools));
    
    // The agent should only use its available tools
    for (const tool of toolUsage.uniqueTools) {
      expect(Object.keys(thinkAndPrepAgent.tools)).toContain(tool);
    }
  });
});
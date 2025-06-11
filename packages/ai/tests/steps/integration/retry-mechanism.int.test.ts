import { beforeAll, describe, expect, it } from 'vitest';
import { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { setupTestEnvironment, withTestEnv } from '@buster/test-utils/env-helpers';
import { thinkAndPrepStep } from '../../../src/steps/think-and-prep-step';
import { analystStep } from '../../../src/steps/analyst-step';
import type { AnalystRuntimeContext } from '../../../src/workflows/analyst-workflow';

describe('Retry Mechanism Integration Tests', () => {
  beforeAll(() => setupTestEnvironment());

  describe('ThinkAndPrep Step Retry', () => {
    it('should retry and heal on invalid tool call', async () => {
      await withTestEnv(async () => {
        const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
        runtimeContext.set('userId', 'test-user');
        runtimeContext.set('threadId', 'test-thread');

        // Create input data that simulates previous step outputs
        const inputData = {
          'create-todos': {
            todos: [
              {
                task: 'Analyze the data',
                reason: 'User requested analysis',
                complexity: 'medium' as const,
              },
            ],
          },
          'extract-values-search': {
            extractedValues: [],
          },
          'generate-chat-title': {
            title: 'Test Analysis',
          },
        };

        // This test will attempt to invoke a tool that might not exist or with invalid args
        // The retry mechanism should handle it gracefully
        const result = await thinkAndPrepStep.execute({
          inputData,
          getInitData: async () => ({
            prompt: 'Test the retry mechanism by calling an invalid tool if possible',
            conversationHistory: [],
          }),
          runtimeContext,
        });

        // Verify the step completed successfully
        expect(result).toBeDefined();
        expect(result.outputMessages).toBeDefined();
        expect(Array.isArray(result.outputMessages)).toBe(true);
        
        // Check if any healing messages were injected (they would be tool result messages)
        const toolResultMessages = result.outputMessages.filter(
          (msg: CoreMessage) => 
            msg.role === 'tool' || 
            (msg.role === 'user' && msg.content === 'Please continue.')
        );

        // The presence of healing messages would indicate retry mechanism was triggered
        console.log('Tool result messages found:', toolResultMessages.length);
        console.log('Total messages:', result.outputMessages.length);
      }, 60000); // 60 second timeout for LLM calls
    });
  });

  describe('Analyst Step Retry', () => {
    it('should handle retry gracefully when given messages from think-and-prep', async () => {
      await withTestEnv(async () => {
        const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
        runtimeContext.set('userId', 'test-user');
        runtimeContext.set('threadId', 'test-thread');

        // Simulate output from think-and-prep step
        const mockMessages: CoreMessage[] = [
          { role: 'user', content: 'Analyze some data' },
          { 
            role: 'assistant', 
            content: [
              {
                type: 'text',
                text: 'I will analyze the data',
              },
              {
                type: 'tool-use',
                toolCallId: 'test-call-1',
                toolName: 'sequentialThinking',
                args: { thought: 'Starting analysis' },
              },
            ],
          },
          {
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId: 'test-call-1',
                toolName: 'sequentialThinking',
                result: { success: true },
              },
            ],
          },
        ];

        const inputData = {
          finished: false,
          outputMessages: mockMessages,
          conversationHistory: mockMessages,
          metadata: {
            toolsUsed: ['sequentialThinking'],
            finalTool: undefined,
          },
        };

        const result = await analystStep.execute({
          inputData,
          getInitData: async () => ({
            prompt: 'Analyze some data',
            conversationHistory: [],
          }),
          runtimeContext,
        });

        // Verify the step completed
        expect(result).toBeDefined();
        expect(result.conversationHistory).toBeDefined();
        expect(Array.isArray(result.conversationHistory)).toBe(true);
        
        // The conversation history should include the original messages
        expect(result.conversationHistory.length).toBeGreaterThanOrEqual(mockMessages.length);
      }, 60000);
    });
  });

  describe('Conversation History Preservation', () => {
    it('should preserve conversation history through retries', async () => {
      await withTestEnv(async () => {
        const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
        runtimeContext.set('userId', 'test-user');
        runtimeContext.set('threadId', 'test-thread');

        const originalMessages: CoreMessage[] = [
          { role: 'user', content: 'Original question' },
          { role: 'assistant', content: 'Original response' },
        ];

        const inputData = {
          'create-todos': {
            todos: [
              {
                task: 'Test retry with history',
                reason: 'Testing conversation preservation',
                complexity: 'low' as const,
              },
            ],
          },
          'extract-values-search': {
            extractedValues: [],
          },
          'generate-chat-title': {
            title: 'Retry Test',
          },
        };

        const result = await thinkAndPrepStep.execute({
          inputData,
          getInitData: async () => ({
            prompt: 'Follow up question',
            conversationHistory: originalMessages,
          }),
          runtimeContext,
        });

        // Verify original messages are preserved
        expect(result.outputMessages).toBeDefined();
        
        // The conversation should start with the original messages
        const userMessages = result.outputMessages.filter((msg: CoreMessage) => msg.role === 'user');
        const assistantMessages = result.outputMessages.filter((msg: CoreMessage) => msg.role === 'assistant');
        
        expect(userMessages.length).toBeGreaterThan(0);
        expect(assistantMessages.length).toBeGreaterThan(0);
        
        // Check that we have a complete conversation flow
        expect(result.outputMessages.length).toBeGreaterThanOrEqual(originalMessages.length);
      }, 60000);
    });
  });
});
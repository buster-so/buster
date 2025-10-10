import { describe, expect, it } from 'vitest';
import {
  addReasoningContent,
  addTextContent,
  addToolCall,
  addToolResult,
  createMessageAccumulatorState,
  resetStepState,
} from './message-accumulator';

describe('message-accumulator', () => {
  describe('createMessageAccumulatorState', () => {
    it('should create empty initial state', () => {
      const state = createMessageAccumulatorState();

      expect(state.messages).toEqual([]);
      expect(state.currentStepAssistantMessage).toBeNull();
      expect(state.currentToolMessage).toBeNull();
      expect(state.assistantMessageCreated).toBe(false);
    });

    it('should create state with initial messages', () => {
      const initialMessages = [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }] as any;
      const state = createMessageAccumulatorState(initialMessages);

      expect(state.messages).toEqual(initialMessages);
      expect(state.messages).not.toBe(initialMessages); // Should be a copy
    });
  });

  describe('resetStepState', () => {
    it('should reset step-specific state while preserving messages', () => {
      const state = createMessageAccumulatorState();
      const stateWithMessage = addTextContent(state, 'test');

      const resetState = resetStepState(stateWithMessage);

      expect(resetState.messages).toEqual(stateWithMessage.messages);
      expect(resetState.currentStepAssistantMessage).toBeNull();
      expect(resetState.currentToolMessage).toBeNull();
      expect(resetState.assistantMessageCreated).toBe(false);
    });
  });

  describe('addReasoningContent', () => {
    it('should create assistant message when none exists', () => {
      const state = createMessageAccumulatorState();
      const newState = addReasoningContent(state, 'thinking about it');

      expect(newState.messages).toHaveLength(1);
      expect(newState.messages[0]).toEqual({
        role: 'assistant',
        content: [{ type: 'reasoning', text: 'thinking about it' }],
      });
      expect(newState.assistantMessageCreated).toBe(true);
      expect(newState.currentStepAssistantMessage).toBe(newState.messages[0]);
    });

    it('should append to existing assistant message', () => {
      const state = createMessageAccumulatorState();
      const stateWithText = addTextContent(state, 'initial text');
      const finalState = addReasoningContent(stateWithText, 'more thinking');

      expect(finalState.messages).toHaveLength(1);
      expect(finalState.messages[0]?.content).toHaveLength(2);
      expect(finalState.messages[0]?.content[1]).toEqual({
        type: 'reasoning',
        text: 'more thinking',
      });
    });
  });

  describe('addTextContent', () => {
    it('should create assistant message when none exists', () => {
      const state = createMessageAccumulatorState();
      const newState = addTextContent(state, 'hello world');

      expect(newState.messages).toHaveLength(1);
      expect(newState.messages[0]).toEqual({
        role: 'assistant',
        content: [{ type: 'text', text: 'hello world' }],
      });
      expect(newState.assistantMessageCreated).toBe(true);
    });

    it('should append to existing assistant message', () => {
      const state = createMessageAccumulatorState();
      const stateWithReasoning = addReasoningContent(state, 'thinking');
      const finalState = addTextContent(stateWithReasoning, 'response');

      expect(finalState.messages).toHaveLength(1);
      expect(finalState.messages[0]?.content).toHaveLength(2);
    });
  });

  describe('addToolCall', () => {
    it('should create assistant message when none exists', () => {
      const state = createMessageAccumulatorState();
      const newState = addToolCall(state, 'call-1', 'glob', { pattern: '*.ts' });

      expect(newState.messages).toHaveLength(1);
      expect(newState.messages[0]).toEqual({
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call-1',
            toolName: 'glob',
            input: { pattern: '*.ts' },
          },
        ],
      });
      expect(newState.assistantMessageCreated).toBe(true);
    });

    it('should append to existing assistant message', () => {
      const state = createMessageAccumulatorState();
      const stateWithReasoning = addReasoningContent(state, 'need to search');
      const finalState = addToolCall(stateWithReasoning, 'call-1', 'glob', { pattern: '*.ts' });

      expect(finalState.messages).toHaveLength(1);
      expect(finalState.messages[0]?.content).toHaveLength(2);
      expect(finalState.messages[0]?.content[1]).toMatchObject({
        type: 'tool-call',
        toolCallId: 'call-1',
      });
    });

    it('should handle interleaved tool calls and results correctly', () => {
      // This is the critical test case that was failing
      const state = createMessageAccumulatorState();

      // First tool call
      let newState = addToolCall(state, 'call-1', 'glob', { pattern: '*.ts' });
      expect(newState.messages).toHaveLength(1);
      expect(newState.messages[0]?.role).toBe('assistant');

      // First tool result (creates tool message)
      newState = addToolResult(newState, 'call-1', 'glob', { matches: [] });
      expect(newState.messages).toHaveLength(2);
      expect(newState.messages[1]?.role).toBe('tool');

      // Second tool call (should still append to assistant message, not fail!)
      newState = addToolCall(newState, 'call-2', 'read', { path: '/test.ts' });
      expect(newState.messages).toHaveLength(2); // Should not create new assistant message
      expect(newState.messages[0]?.content).toHaveLength(2); // Both tool calls in assistant
      expect(newState.messages[1]?.role).toBe('tool'); // Tool message still separate

      // Second tool result (should append to existing tool message)
      newState = addToolResult(newState, 'call-2', 'read', { content: 'test' });
      expect(newState.messages).toHaveLength(2); // No new messages
      expect(newState.messages[1]?.content).toHaveLength(2); // Both results in tool message
    });

    it('should handle multiple parallel tool calls', () => {
      const state = createMessageAccumulatorState();

      // Add multiple tool calls in sequence
      let newState = addToolCall(state, 'call-1', 'glob', { pattern: '*.ts' });
      newState = addToolCall(newState, 'call-2', 'grep', { pattern: 'test' });
      newState = addToolCall(newState, 'call-3', 'read', { path: '/file.ts' });

      expect(newState.messages).toHaveLength(1);
      expect(newState.messages[0]?.role).toBe('assistant');
      expect(newState.messages[0]?.content).toHaveLength(3);

      // Verify all tool calls are present
      const toolCalls = newState.messages[0]?.content;
      expect(toolCalls?.[0]).toMatchObject({ toolCallId: 'call-1' });
      expect(toolCalls?.[1]).toMatchObject({ toolCallId: 'call-2' });
      expect(toolCalls?.[2]).toMatchObject({ toolCallId: 'call-3' });
    });
  });

  describe('addToolResult', () => {
    it('should create tool message when none exists', () => {
      const state = createMessageAccumulatorState();
      // Need assistant message first
      const stateWithCall = addToolCall(state, 'call-1', 'glob', { pattern: '*.ts' });
      const finalState = addToolResult(stateWithCall, 'call-1', 'glob', { matches: [] });

      expect(finalState.messages).toHaveLength(2);
      expect(finalState.messages[1]).toEqual({
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'call-1',
            toolName: 'glob',
            output: { type: 'json', value: '{"matches":[]}' },
          },
        ],
      });
    });

    it('should append to existing tool message', () => {
      const state = createMessageAccumulatorState();
      const stateWithCall1 = addToolCall(state, 'call-1', 'glob', {});
      const stateWithCall2 = addToolCall(stateWithCall1, 'call-2', 'read', {});
      const stateWithResult1 = addToolResult(stateWithCall2, 'call-1', 'glob', { data: 1 });
      const finalState = addToolResult(stateWithResult1, 'call-2', 'read', { data: 2 });

      expect(finalState.messages).toHaveLength(2);
      expect(finalState.messages[1]?.content).toHaveLength(2);
    });

    it('should handle string output directly', () => {
      const state = createMessageAccumulatorState();
      const stateWithCall = addToolCall(state, 'call-1', 'bash', { command: 'ls' });
      const finalState = addToolResult(stateWithCall, 'call-1', 'bash', 'file1.ts\nfile2.ts');

      expect(finalState.messages[1]?.content[0]).toMatchObject({
        output: { type: 'json', value: 'file1.ts\nfile2.ts' },
      });
    });

    it('should stringify object output', () => {
      const state = createMessageAccumulatorState();
      const stateWithCall = addToolCall(state, 'call-1', 'glob', {});
      const finalState = addToolResult(stateWithCall, 'call-1', 'glob', { matches: ['a', 'b'] });

      expect(finalState.messages[1]?.content[0]).toMatchObject({
        output: { type: 'json', value: '{"matches":["a","b"]}' },
      });
    });
  });

  describe('realistic multi-step scenario', () => {
    it('should handle complete conversation flow', () => {
      // Start with user message
      const initialMessages = [
        { role: 'user', content: [{ type: 'text', text: 'find and read test files' }] },
      ] as any;

      let state = createMessageAccumulatorState(initialMessages);

      // Step 1: Reasoning + tool calls
      state = addReasoningContent(state, 'I need to search for test files');
      state = addToolCall(state, 'call-1', 'glob', { pattern: '**/*.test.ts' });
      state = addToolCall(state, 'call-2', 'glob', { pattern: '**/*.spec.ts' });

      // Results come back (potentially out of order)
      state = addToolResult(state, 'call-2', 'glob', { matches: ['spec.ts'] });
      state = addToolResult(state, 'call-1', 'glob', { matches: ['test.ts'] });

      expect(state.messages).toHaveLength(3); // user, assistant, tool
      expect(state.messages[1]?.content).toHaveLength(3); // reasoning + 2 tool calls
      expect(state.messages[2]?.content).toHaveLength(2); // 2 tool results

      // Step 2: New step (reset and continue)
      state = resetStepState(state);
      state = addToolCall(state, 'call-3', 'read', { path: 'test.ts' });
      state = addToolResult(state, 'call-3', 'read', { content: 'test content' });

      expect(state.messages).toHaveLength(5); // + new assistant, new tool
      expect(state.messages[3]?.content).toHaveLength(1); // Just the read tool call
      expect(state.messages[4]?.content).toHaveLength(1); // Just the read result

      // Step 3: Final text response
      state = resetStepState(state);
      state = addTextContent(state, 'Found and read test files successfully');

      expect(state.messages).toHaveLength(6);
      expect(state.messages[5]).toEqual({
        role: 'assistant',
        content: [{ type: 'text', text: 'Found and read test files successfully' }],
      });
    });
  });
});

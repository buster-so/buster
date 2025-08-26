import { InvalidToolInputError, NoSuchToolError } from 'ai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Set up environment variables before any imports to prevent initialization errors
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.VERTEX_CLIENT_EMAIL = 'test-vertex-email';
process.env.VERTEX_PRIVATE_KEY = 'test-vertex-key';
process.env.VERTEX_PROJECT = 'test-vertex-project';

// Mock the strategy functions
vi.mock('./strategies/structured-output-strategy', () => ({
  canHandleInvalidInput: vi.fn(),
  repairInvalidInput: vi.fn(),
}));

vi.mock('./strategies/re-ask-strategy', () => ({
  canHandleNoSuchTool: vi.fn(),
  repairWrongToolName: vi.fn(),
}));

// Import after all mocks are set up
import { ANALYST_AGENT_NAME } from '../../agents';
import { repairToolCall } from './repair-tool-call';
import type { RepairContext } from './types';

describe('repairToolCall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should use repairInvalidInput for InvalidToolInputError', async () => {
    const { canHandleInvalidInput, repairInvalidInput } = await import(
      './strategies/structured-output-strategy'
    );
    const { canHandleNoSuchTool } = await import('./strategies/re-ask-strategy');

    vi.mocked(canHandleInvalidInput).mockReturnValue(true);
    vi.mocked(canHandleNoSuchTool).mockReturnValue(false);
    vi.mocked(repairInvalidInput).mockResolvedValue({
      toolCallType: 'function',
      toolCallId: 'call123',
      toolName: 'testTool',
      input: JSON.stringify({ fixed: true }),
    } as any);

    const context: RepairContext = {
      toolCall: {
        toolCallType: 'function',
        toolCallId: 'call123',
        toolName: 'testTool',
        input: JSON.stringify({ invalid: true }),
      } as any,
      tools: {
        testTool: { inputSchema: {} },
      } as any,
      error: new InvalidToolInputError({
        toolName: 'testTool',
        toolInput: 'invalid',
        cause: new Error('validation failed'),
      }),
      messages: [],
      system: '',
    };

    const result = await repairToolCall(context);

    expect(result).toEqual({
      toolCallType: 'function',
      toolCallId: 'call123',
      toolName: 'testTool',
      input: JSON.stringify({ fixed: true }),
    });

    expect(canHandleInvalidInput).toHaveBeenCalledWith(context.error);
    expect(repairInvalidInput).toHaveBeenCalledWith(context);
  });

  it('should use repairWrongToolName for NoSuchToolError', async () => {
    const { canHandleInvalidInput } = await import('./strategies/structured-output-strategy');
    const { canHandleNoSuchTool, repairWrongToolName } = await import(
      './strategies/re-ask-strategy'
    );

    vi.mocked(canHandleInvalidInput).mockReturnValue(false);
    vi.mocked(canHandleNoSuchTool).mockReturnValue(true);
    vi.mocked(repairWrongToolName).mockResolvedValue({
      toolCallType: 'function',
      toolCallId: 'call456',
      toolName: 'correctTool',
      input: '{}',
    } as any);

    const context: RepairContext = {
      toolCall: {
        toolCallType: 'function',
        toolCallId: 'call456',
        toolName: 'wrongTool',
        input: '{}',
      } as any,
      tools: {
        correctTool: { inputSchema: {} },
      } as any,
      error: new NoSuchToolError({
        toolName: 'wrongTool',
        availableTools: ['correctTool'],
      }),
      messages: [],
      system: '',
    };

    const result = await repairToolCall(context);

    expect(result).toEqual({
      toolCallType: 'function',
      toolCallId: 'call456',
      toolName: 'correctTool',
      input: '{}',
    });

    expect(canHandleNoSuchTool).toHaveBeenCalledWith(context.error);
    expect(repairWrongToolName).toHaveBeenCalledWith(context);
  });

  it('should return null if no strategy can handle the error', async () => {
    const { canHandleInvalidInput } = await import('./strategies/structured-output-strategy');
    const { canHandleNoSuchTool } = await import('./strategies/re-ask-strategy');

    vi.mocked(canHandleInvalidInput).mockReturnValue(false);
    vi.mocked(canHandleNoSuchTool).mockReturnValue(false);

    const context: RepairContext = {
      toolCall: {
        toolCallType: 'function',
        toolCallId: 'call789',
        toolName: 'someTool',
        input: '{}',
      } as any,
      tools: {} as any,
      error: new Error('Unknown error') as any,
      messages: [],
      system: '',
    };

    const result = await repairToolCall(context);

    expect(result).toBeNull();
  });

  it('should log appropriate messages with agent context', async () => {
    const { canHandleInvalidInput, repairInvalidInput } = await import(
      './strategies/structured-output-strategy'
    );
    const { canHandleNoSuchTool } = await import('./strategies/re-ask-strategy');

    vi.mocked(canHandleInvalidInput).mockReturnValue(true);
    vi.mocked(canHandleNoSuchTool).mockReturnValue(false);
    vi.mocked(repairInvalidInput).mockResolvedValue({
      toolCallType: 'function',
      toolCallId: 'call123',
      toolName: 'testTool',
      input: JSON.stringify({ fixed: true }),
    } as any);

    const consoleInfoSpy = vi.spyOn(console, 'info');

    const context: RepairContext = {
      toolCall: {
        toolCallType: 'function',
        toolCallId: 'call123',
        toolName: 'testTool',
        input: JSON.stringify({ invalid: true }),
      } as any,
      tools: {
        testTool: { inputSchema: {} },
      } as any,
      error: new InvalidToolInputError({
        toolName: 'testTool',
        toolInput: 'invalid',
        cause: new Error('validation failed'),
      }),
      messages: [],
      system: '',
      agentContext: {
        agentName: ANALYST_AGENT_NAME,
        availableTools: ['testTool'],
      },
    };

    await repairToolCall(context);

    // Check that "Repairing invalid tool input" was called
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      'Repairing invalid tool input',
      expect.objectContaining({
        agentName: ANALYST_AGENT_NAME,
      })
    );

    consoleInfoSpy.mockRestore();
  });

  it('should log warning for unknown error types', async () => {
    const { canHandleInvalidInput } = await import('./strategies/structured-output-strategy');
    const { canHandleNoSuchTool } = await import('./strategies/re-ask-strategy');

    vi.mocked(canHandleInvalidInput).mockReturnValue(false);
    vi.mocked(canHandleNoSuchTool).mockReturnValue(false);

    const consoleWarnSpy = vi.spyOn(console, 'warn');

    const context: RepairContext = {
      toolCall: {
        toolCallType: 'function',
        toolCallId: 'call789',
        toolName: 'someTool',
        input: '{}',
      } as any,
      tools: {} as any,
      error: new Error('Unknown error') as any,
      messages: [],
      system: '',
    };

    await repairToolCall(context);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'No repair strategy for error type',
      expect.objectContaining({
        errorType: 'Error',
        errorMessage: 'Unknown error',
        toolName: 'someTool',
      })
    );

    consoleWarnSpy.mockRestore();
  });
});

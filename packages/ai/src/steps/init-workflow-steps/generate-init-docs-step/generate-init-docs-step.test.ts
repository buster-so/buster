import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModelQueueItem } from '../build-models-queue-step/types';
import {
  generateInitDocs,
  processBatch,
  processModel,
  replaceModelPath,
} from './generate-init-docs-step';
import type { GenerateInitDocsStepInput } from './types';

// Mock the agent module
vi.mock('../../../agents', () => ({
  createAnalyticsEngineerAgent: vi.fn(),
}));

describe('replaceModelPath', () => {
  it('should replace single occurrence of {{model_path}}', () => {
    const template = 'Document the model at {{model_path}}';
    const modelPath = '/project/models/dim_customers.sql';

    const result = replaceModelPath(template, modelPath);

    expect(result).toBe('Document the model at /project/models/dim_customers.sql');
  });

  it('should replace multiple occurrences of {{model_path}}', () => {
    const template = 'Model: {{model_path}}\nPath: {{model_path}}';
    const modelPath = '/path/to/model.sql';

    const result = replaceModelPath(template, modelPath);

    expect(result).toBe('Model: /path/to/model.sql\nPath: /path/to/model.sql');
  });

  it('should handle template without placeholder', () => {
    const template = 'Document this model';
    const modelPath = '/path/to/model.sql';

    const result = replaceModelPath(template, modelPath);

    expect(result).toBe('Document this model');
  });

  it('should handle empty model path', () => {
    const template = 'Model: {{model_path}}';
    const modelPath = '';

    const result = replaceModelPath(template, modelPath);

    expect(result).toBe('Model: ');
  });

  it('should handle empty template', () => {
    const template = '';
    const modelPath = '/path/to/model.sql';

    const result = replaceModelPath(template, modelPath);

    expect(result).toBe('');
  });
});

describe('processModel', () => {
  const mockModel: ModelQueueItem = {
    absolutePath: '/project/models/dim_customers.sql',
    relativePath: 'dim_customers.sql',
    fileName: 'dim_customers.sql',
    modelName: 'dim_customers',
    modelDirectory: '/project/models',
  };

  const mockAgentOptions = {
    chatId: 'test-chat',
    messageId: 'test-message',
    userId: 'test-user',
    organizationId: 'test-org',
    dataSourceId: 'test-datasource',
  };

  const mockPromptTemplate = 'Document {{model_path}}';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully process model', async () => {
    // Mock the agent creation and stream
    const { createAnalyticsEngineerAgent } = await import('../../../agents');
    const mockStream = {
      fullStream: (async function* () {
        yield { type: 'text', text: 'Processing...' };
      })(),
    };

    const mockAgent = {
      stream: vi.fn().mockResolvedValue(mockStream),
    };

    vi.mocked(createAnalyticsEngineerAgent).mockReturnValue(mockAgent as any);

    const result = await processModel(mockModel, mockPromptTemplate, mockAgentOptions);

    expect(result).toEqual({
      modelName: 'dim_customers',
      success: true,
    });
  });

  it('should handle agent failure', async () => {
    // Mock agent that throws error
    const { createAnalyticsEngineerAgent } = await import('../../../agents');
    const mockAgent = {
      stream: vi.fn().mockRejectedValue(new Error('Agent failed')),
    };

    vi.mocked(createAnalyticsEngineerAgent).mockReturnValue(mockAgent as any);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await processModel(mockModel, mockPromptTemplate, mockAgentOptions);

    expect(result.success).toBe(false);
    expect(result.modelName).toBe('dim_customers');
    expect(result.error).toBeDefined();

    consoleSpy.mockRestore();
  });

  it('should replace model_path in prompt', async () => {
    const { createAnalyticsEngineerAgent } = await import('../../../agents');
    const streamMock = vi.fn().mockResolvedValue({
      fullStream: (async function* () {
        yield {};
      })(),
    });

    const mockAgent = {
      stream: streamMock,
    };

    vi.mocked(createAnalyticsEngineerAgent).mockReturnValue(mockAgent as any);

    await processModel(mockModel, mockPromptTemplate, mockAgentOptions);

    // Verify stream was called with replaced path
    const callArgs = streamMock.mock.calls[0]?.[0];
    expect(callArgs?.messages[0]?.content).toContain(mockModel.absolutePath);
  });
});

describe('processBatch', () => {
  const mockModels: ModelQueueItem[] = [
    {
      absolutePath: '/project/models/model1.sql',
      relativePath: 'model1.sql',
      fileName: 'model1.sql',
      modelName: 'model1',
      modelDirectory: '/project/models',
    },
    {
      absolutePath: '/project/models/model2.sql',
      relativePath: 'model2.sql',
      fileName: 'model2.sql',
      modelName: 'model2',
      modelDirectory: '/project/models',
    },
  ];

  const mockAgentOptions = {
    chatId: 'test-chat',
    messageId: 'test-message',
    userId: 'test-user',
    organizationId: 'test-org',
    dataSourceId: 'test-datasource',
  };

  const mockPromptTemplate = 'Document {{model_path}}';

  it('should process all models in batch', async () => {
    const result = await processBatch(mockModels, mockPromptTemplate, mockAgentOptions);

    expect(result).toHaveLength(2);
    expect(result.every((r) => typeof r.success === 'boolean')).toBe(true);
  });

  it('should handle empty batch', async () => {
    const result = await processBatch([], mockPromptTemplate, mockAgentOptions);

    expect(result).toHaveLength(0);
  });

  it('should continue processing if one model fails', async () => {
    // This test verifies that Promise.all handles individual rejections
    // Since processModel catches its own errors, all promises should resolve
    const result = await processBatch(mockModels, mockPromptTemplate, mockAgentOptions);

    expect(result).toHaveLength(mockModels.length);
  });
});

describe('generateInitDocs', () => {
  const mockInput: GenerateInitDocsStepInput = {
    models: [
      {
        absolutePath: '/project/models/model1.sql',
        relativePath: 'model1.sql',
        fileName: 'model1.sql',
        modelName: 'model1',
        modelDirectory: '/project/models',
      },
      {
        absolutePath: '/project/models/model2.sql',
        relativePath: 'model2.sql',
        fileName: 'model2.sql',
        modelName: 'model2',
        modelDirectory: '/project/models',
      },
    ],
    chatId: 'test-chat',
    messageId: 'test-message',
    userId: 'test-user',
    organizationId: 'test-org',
    dataSourceId: 'test-datasource',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process all models', async () => {
    // Mock file reading
    vi.mock('node:fs/promises', () => ({
      readFile: vi.fn().mockResolvedValue('Document {{model_path}}'),
    }));

    const result = await generateInitDocs(mockInput);

    expect(result).toHaveLength(2);
    expect(result.every((r) => r.modelName)).toBe(true);
  });

  it('should log batch progress', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    vi.mock('node:fs/promises', () => ({
      readFile: vi.fn().mockResolvedValue('Document {{model_path}}'),
    }));

    await generateInitDocs(mockInput);

    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Processing batch'));

    consoleInfoSpy.mockRestore();
  });

  it('should log final summary', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    vi.mock('node:fs/promises', () => ({
      readFile: vi.fn().mockResolvedValue('Document {{model_path}}'),
    }));

    await generateInitDocs(mockInput);

    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Processed'));

    consoleInfoSpy.mockRestore();
  });

  it('should handle empty models array', async () => {
    const emptyInput: GenerateInitDocsStepInput = {
      ...mockInput,
      models: [],
    };

    vi.mock('node:fs/promises', () => ({
      readFile: vi.fn().mockResolvedValue('Document {{model_path}}'),
    }));

    const result = await generateInitDocs(emptyInput);

    expect(result).toHaveLength(0);
  });

  it('should process models in batches of 10', async () => {
    // Create 25 models to test batching
    const manyModels: ModelQueueItem[] = Array.from({ length: 25 }, (_, i) => ({
      absolutePath: `/project/models/model${i}.sql`,
      relativePath: `model${i}.sql`,
      fileName: `model${i}.sql`,
      modelName: `model${i}`,
      modelDirectory: '/project/models',
    }));

    const largeInput: GenerateInitDocsStepInput = {
      ...mockInput,
      models: manyModels,
    };

    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    vi.mock('node:fs/promises', () => ({
      readFile: vi.fn().mockResolvedValue('Document {{model_path}}'),
    }));

    const result = await generateInitDocs(largeInput);

    expect(result).toHaveLength(25);

    // Should have logged 3 batches (10, 10, 5)
    const batchLogs = consoleInfoSpy.mock.calls.filter((call) =>
      call[0]?.includes('Processing batch')
    );
    expect(batchLogs.length).toBe(3);

    consoleInfoSpy.mockRestore();
  });

  it('should warn about failed models', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock to cause failure
    const { createAnalyticsEngineerAgent } = await import('../../../agents');
    const failingAgent = {
      stream: vi.fn().mockRejectedValue(new Error('Mock failure')),
    };

    vi.mocked(createAnalyticsEngineerAgent).mockReturnValue(failingAgent as any);

    await generateInitDocs(mockInput);

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed models:'));

    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});

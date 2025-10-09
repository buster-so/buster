import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deployHandler } from './deploy-handler';
import type { DeployOptions } from './schemas';
import { DeploymentValidationError } from './utils/errors';

// Mock the required modules
vi.mock('./config/config-loader', () => ({
  loadBusterConfig: vi.fn().mockResolvedValue({
    config: {
      projects: [
        {
          name: 'test-project',
          data_source_name: 'test-datasource',
          schema: 'public',
          include: ['**/*.yml'],
          exclude: [],
        },
      ],
    },
    configPath: '/test/buster.yml',
  }),
  getConfigBaseDir: vi.fn().mockReturnValue('/test'),
  resolveConfiguration: vi.fn().mockReturnValue({
    data_source_name: 'test-datasource',
    schema: 'public',
    include: ['**/*.yml'],
    exclude: [],
  }),
}));

vi.mock('./models/discovery', () => ({
  discoverModelFiles: vi.fn(),
  filterModelFiles: vi.fn(),
}));

vi.mock('./models/parsing', () => ({
  parseModelFile: vi.fn(),
  resolveModelConfig: vi.fn(),
  validateModel: vi.fn(),
  formatZodIssues: vi.fn().mockReturnValue([]),
  formatZodIssuesWithContext: vi.fn().mockReturnValue([]),
  generateDefaultSQL: vi.fn().mockReturnValue('SELECT * FROM test_model'),
}));

vi.mock('./deployment/transformers', () => ({
  validateModelsForDeployment: vi.fn().mockImplementation((models) => ({
    valid: models,
    invalid: [],
  })),
  prepareDeploymentRequest: vi.fn().mockImplementation((models) => ({ models })),
  createModelFileMap: vi.fn().mockReturnValue(new Map()),
}));

vi.mock('./deployment/results', () => ({
  mergeDeploymentResults: vi.fn().mockImplementation((results) =>
    results.length > 0
      ? results[0]
      : {
          success: [],
          updated: [],
          noChange: [],
          failures: [],
          excluded: [],
          todos: [],
        }
  ),
  formatDeploymentSummary: vi.fn().mockReturnValue('Deployment summary'),
  processDeploymentResponse: vi.fn().mockReturnValue({
    success: [],
    updated: [],
    noChange: [],
    failures: [],
    excluded: [],
    todos: [],
  }),
  createParseFailures: vi.fn().mockReturnValue([]),
}));

vi.mock('./deployment/strategies', () => ({
  createDryRunDeployer: vi.fn().mockReturnValue(async () => ({
    success: [],
    updated: [],
    noChange: [],
    failures: [],
    deleted: [],
    summary: {
      totalModels: 0,
      successCount: 0,
      updateCount: 0,
      noChangeCount: 0,
      failureCount: 0,
      deletedCount: 0,
    },
  })),
  createAuthenticatedDeployer: vi.fn(),
}));

describe('Deploy Handler Validation', () => {
  const mockOptions: DeployOptions = {
    dryRun: true,
    verbose: false,
    debug: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should throw DeploymentValidationError when models have TODO markers', async () => {
    const { discoverModelFiles, filterModelFiles } = await import('./models/discovery');
    const { parseModelFile, formatZodIssuesWithContext } = await import('./models/parsing');

    vi.mocked(discoverModelFiles).mockResolvedValue(['/test/model1.yml']);
    vi.mocked(filterModelFiles).mockResolvedValue({
      included: ['/test/model1.yml'],
      excluded: [],
    });

    // Mock formatZodIssuesWithContext to return TODO marker message - exact string match
    vi.mocked(formatZodIssuesWithContext).mockReturnValueOnce([
      'File contains {{TODO}} markers and will be skipped',
    ]);

    // Mock a file with TODO markers
    vi.mocked(parseModelFile).mockResolvedValue({
      models: [],
      errors: [
        {
          issues: [
            {
              code: 'custom',
              path: [],
              message: 'File contains {{TODO}} markers and will be skipped',
            } as any,
          ],
          rawData: { name: 'test_model' },
        },
      ],
    });

    try {
      await deployHandler(mockOptions);
      expect.fail('Should have thrown DeploymentValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(DeploymentValidationError);
      expect((error as DeploymentValidationError).message).toMatch(/Cannot deploy.*TODO/);
      expect((error as DeploymentValidationError).todoFiles).toHaveLength(1);
    }
  });

  it('should throw DeploymentValidationError when models have validation errors', async () => {
    const { discoverModelFiles, filterModelFiles } = await import('./models/discovery');
    const { parseModelFile, validateModel } = await import('./models/parsing');

    vi.mocked(discoverModelFiles).mockResolvedValue(['/test/model1.yml']);
    vi.mocked(filterModelFiles).mockResolvedValue({
      included: ['/test/model1.yml'],
      excluded: [],
    });

    // Mock a model with validation errors
    vi.mocked(parseModelFile).mockResolvedValue({
      models: [
        {
          name: 'test_model',
          data_source_name: 'test_ds',
          schema: 'public',
          dimensions: [],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
        } as any,
      ],
      errors: [],
    });

    vi.mocked(validateModel).mockReturnValue({
      valid: false,
      errors: ['Model must have at least one dimension or measure'],
      todos: [],
    });

    await expect(deployHandler(mockOptions)).rejects.toThrow(DeploymentValidationError);
    await expect(deployHandler(mockOptions)).rejects.toThrow(/Cannot deploy.*error/);
  });

  it('should proceed with deployment when all models are valid', async () => {
    const { discoverModelFiles, filterModelFiles } = await import('./models/discovery');
    const { parseModelFile, validateModel, resolveModelConfig } = await import('./models/parsing');

    vi.mocked(discoverModelFiles).mockResolvedValue(['/test/model1.yml']);
    vi.mocked(filterModelFiles).mockResolvedValue({
      included: ['/test/model1.yml'],
      excluded: [],
    });

    const validModel = {
      name: 'test_model',
      data_source_name: 'test_ds',
      schema: 'public',
      dimensions: [
        {
          name: 'id',
          type: 'number',
          primary_key: true,
        },
      ],
      measures: [
        {
          name: 'count',
          type: 'count',
        },
      ],
      metrics: [],
      filters: [],
      relationships: [],
    } as any;

    // Mock a valid model
    vi.mocked(parseModelFile).mockResolvedValue({
      models: [validModel],
      errors: [],
    });

    vi.mocked(resolveModelConfig).mockReturnValue(validModel);

    vi.mocked(validateModel).mockReturnValue({
      valid: true,
      errors: [],
      todos: [],
    });

    const result = await deployHandler(mockOptions);

    expect(result).toBeDefined();
    expect(result.failures).toHaveLength(0);
    expect(result.todos).toHaveLength(0);
  });

  it('should show detailed errors in verbose mode', async () => {
    const { discoverModelFiles, filterModelFiles } = await import('./models/discovery');
    const { parseModelFile, formatZodIssuesWithContext, formatZodIssues } = await import(
      './models/parsing'
    );

    const verboseOptions: DeployOptions = {
      ...mockOptions,
      verbose: true,
    };

    vi.mocked(discoverModelFiles).mockResolvedValue(['/test/model1.yml', '/test/model2.yml']);
    vi.mocked(filterModelFiles).mockResolvedValue({
      included: ['/test/model1.yml', '/test/model2.yml'],
      excluded: [],
    });

    // Mock formatting functions
    vi.mocked(formatZodIssuesWithContext)
      .mockReturnValueOnce(['File contains {{TODO}} markers and will be skipped'])
      .mockReturnValueOnce(["Model 'bad_model': Invalid type"]);

    vi.mocked(formatZodIssues).mockReturnValueOnce(["Model 'bad_model': Invalid type"]);

    // Mock files with different errors
    vi.mocked(parseModelFile)
      .mockResolvedValueOnce({
        models: [],
        errors: [
          {
            issues: [
              {
                code: 'custom',
                path: [],
                message: 'File contains {{TODO}} markers and will be skipped',
              } as any,
            ],
            rawData: {},
          },
        ],
      })
      .mockResolvedValueOnce({
        models: [],
        errors: [
          {
            modelName: 'bad_model',
            issues: [
              {
                code: 'invalid_type',
                path: ['dimensions', 0, 'type'],
                message: 'Invalid type',
              } as any,
            ],
            rawData: { name: 'bad_model' },
          },
        ],
      });

    const consoleErrorSpy = vi.spyOn(console, 'error');

    await expect(deployHandler(verboseOptions)).rejects.toThrow(DeploymentValidationError);

    // Verify verbose output shows details
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('validation error'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('TODO'));
  });
});

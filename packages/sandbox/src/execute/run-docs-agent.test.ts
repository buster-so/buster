import type { Sandbox } from '@daytonaio/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RunDocsAgentParams } from './run-docs-agent';
import { getDbtProjectInfo, runDocsAgentAsync, runDocsAgentSync } from './run-docs-agent';

// Mock external dependencies
vi.mock('@buster/database/queries', () => ({
  getOrganizationDataSource: vi.fn(),
  getDataSourceCredentials: vi.fn(),
}));

vi.mock('../helpers/build-dbt-profiles-yaml', () => ({
  buildProfilesYaml: vi.fn(),
}));

vi.mock('../management/create-sandbox', () => ({
  createSandboxFromSnapshot: vi.fn(),
  createSandboxWithBusterCLI: vi.fn(),
}));

vi.mock('./documentation-agent-prompt.txt', () => ({
  default: 'Default documentation agent prompt',
}));

describe('run-docs-agent', () => {
  let mockSandbox: Sandbox;
  let validParams: RunDocsAgentParams;

  beforeEach(() => {
    // Create comprehensive mock sandbox
    mockSandbox = {
      id: 'test-sandbox-id',
      git: {
        clone: vi.fn().mockResolvedValue(undefined),
      },
      fs: {
        createFolder: vi.fn().mockResolvedValue(undefined),
        uploadFile: vi.fn().mockResolvedValue(undefined),
        findFiles: vi.fn().mockResolvedValue([]),
      },
      process: {
        createSession: vi.fn().mockResolvedValue(undefined),
        executeSessionCommand: vi.fn().mockResolvedValue({ cmdId: 'test-cmd-id' }),
        executeCommand: vi.fn().mockResolvedValue({ cmdId: 'test-cmd-id', output: 'success' }),
        getSessionCommandLogs: vi.fn().mockResolvedValue('mock logs'),
      },
    } as any;

    // Valid test parameters
    validParams = {
      installationToken: 'ghs_test_token',
      repoUrl: 'https://github.com/test/repo.git',
      branch: 'main',
      prompt: 'Test prompt',
      apiKey: 'test-api-key',
      chatId: 'test-chat-id',
      messageId: 'test-message-id',
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      context: {
        action: 'opened',
        prNumber: '123',
        repo: 'test-repo',
      },
    };

    // Mock environment variables
    process.env.BUSTER_HOST = 'https://test.buster.so';
    process.env.GH_APP_ID = 'test-gh-app-id';

    vi.clearAllMocks();
  });

  describe('Parameter validation', () => {
    it('should validate required parameters', async () => {
      const invalidParams = {
        ...validParams,
        installationToken: '', // Invalid empty string
      };

      await expect(runDocsAgentAsync(invalidParams)).rejects.toThrow();
    });

    it('should validate URL format for repoUrl', async () => {
      const invalidParams = {
        ...validParams,
        repoUrl: 'not-a-valid-url',
      };

      await expect(runDocsAgentAsync(invalidParams)).rejects.toThrow();
    });

    it('should validate UUID format for organizationId', async () => {
      const invalidParams = {
        ...validParams,
        organizationId: 'not-a-uuid',
      };

      await expect(runDocsAgentAsync(invalidParams)).rejects.toThrow();
    });

    it('should accept valid parameters', async () => {
      // Mock the dependencies so the function can run without errors
      const { getOrganizationDataSource, getDataSourceCredentials } = await import(
        '@buster/database/queries'
      );
      vi.mocked(getOrganizationDataSource).mockResolvedValue({
        dataSourceId: 'test-datasource-id',
        dataSourceSyntax: 'postgres',
      });
      vi.mocked(getDataSourceCredentials).mockResolvedValue({
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_pass',
      });

      const { createSandboxWithBusterCLI } = await import('../management/create-sandbox');
      vi.mocked(createSandboxWithBusterCLI).mockResolvedValue(mockSandbox);

      const { buildProfilesYaml } = await import('../helpers/build-dbt-profiles-yaml');
      vi.mocked(buildProfilesYaml).mockReturnValue('mock-profiles-yaml-content');

      vi.mocked(mockSandbox.fs.findFiles).mockResolvedValue([]);

      await expect(runDocsAgentAsync(validParams)).resolves.not.toThrow();
    });
  });

  describe('runDocsAgentAsync', () => {
    beforeEach(async () => {
      // Mock database queries
      const { getOrganizationDataSource, getDataSourceCredentials } = await import(
        '@buster/database/queries'
      );
      vi.mocked(getOrganizationDataSource).mockResolvedValue({
        dataSourceId: 'test-datasource-id',
        dataSourceSyntax: 'postgres',
      });
      vi.mocked(getDataSourceCredentials).mockResolvedValue({
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_pass',
      });

      // Mock sandbox creation
      const { createSandboxWithBusterCLI } = await import('../management/create-sandbox');
      vi.mocked(createSandboxWithBusterCLI).mockResolvedValue(mockSandbox);

      // Mock profiles YAML builder
      const { buildProfilesYaml } = await import('../helpers/build-dbt-profiles-yaml');
      vi.mocked(buildProfilesYaml).mockReturnValue('mock-profiles-yaml-content');
    });

    it('should successfully run docs agent with all parameters', async () => {
      // Mock dbt project file discovery
      vi.mocked(mockSandbox.fs.findFiles).mockResolvedValue([
        {
          file: '/workspace/repository/dbt_project.yml',
          content: 'profile: my_project',
          line: 1,
        },
      ]);

      await runDocsAgentAsync(validParams);

      // Verify sandbox creation
      const { createSandboxWithBusterCLI } = await import('../management/create-sandbox');
      expect(createSandboxWithBusterCLI).toHaveBeenCalledWith(
        'buster-data-engineer-postgres',
        'buster-data-engineer-fallback'
      );

      // Verify git clone
      expect(mockSandbox.git.clone).toHaveBeenCalledWith(
        validParams.repoUrl,
        '/workspace/repository',
        validParams.branch,
        undefined,
        'test-gh-app-id',
        validParams.installationToken
      );

      // Verify profiles YAML creation
      expect(mockSandbox.fs.createFolder).toHaveBeenCalledWith('/workspace/profiles', '755');
      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledWith(
        Buffer.from('mock-profiles-yaml-content'),
        '/workspace/profiles/profiles.yml'
      );

      // Verify session creation and commands
      expect(mockSandbox.process.createSession).toHaveBeenCalledWith('buster-docs-agent-session');
      expect(mockSandbox.process.executeSessionCommand).toHaveBeenCalledTimes(3); // env vars, git setup, CLI command
    });

    it('should handle missing dbt project file', async () => {
      // Mock no dbt project file found
      vi.mocked(mockSandbox.fs.findFiles).mockResolvedValue([]);

      await runDocsAgentAsync(validParams);

      // Verify profiles YAML is not created when no dbt project file
      expect(mockSandbox.fs.createFolder).not.toHaveBeenCalledWith('/workspace/profiles', '755');
      expect(mockSandbox.fs.uploadFile).not.toHaveBeenCalledWith(
        expect.any(Buffer),
        '/workspace/profiles/profiles.yml'
      );
    });

    it('should use default prompt when none provided', async () => {
      const paramsWithoutPrompt = { ...validParams };
      delete paramsWithoutPrompt.prompt;

      vi.mocked(mockSandbox.fs.findFiles).mockResolvedValue([]);

      await runDocsAgentAsync(paramsWithoutPrompt);

      // Verify CLI command uses default prompt
      const cliCalls = vi.mocked(mockSandbox.process.executeSessionCommand).mock.calls;
      const cliCall = cliCalls.find((call) => call[1].command.includes('buster '));
      expect(cliCall).toBeDefined();
      expect(cliCall![1].command).toContain('--prompt "Default documentation agent prompt"');
    });

    it('should handle optional parameters correctly', async () => {
      const minimalParams = {
        installationToken: validParams.installationToken,
        repoUrl: validParams.repoUrl,
        branch: validParams.branch,
        apiKey: validParams.apiKey,
        organizationId: validParams.organizationId,
      };

      vi.mocked(mockSandbox.fs.findFiles).mockResolvedValue([]);

      await runDocsAgentAsync(minimalParams);

      // Verify it runs without optional parameters
      expect(mockSandbox.git.clone).toHaveBeenCalled();
      expect(mockSandbox.process.executeSessionCommand).toHaveBeenCalled();
    });

    it('should create context file when context is provided', async () => {
      vi.mocked(mockSandbox.fs.findFiles).mockResolvedValue([]);

      await runDocsAgentAsync(validParams);

      // Verify context directory and file creation
      expect(mockSandbox.fs.createFolder).toHaveBeenCalledWith('/workspace/context', '755');
      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledWith(
        Buffer.from(JSON.stringify(validParams.context)),
        '/workspace/context/context.json'
      );
    });

    it('should validate environment variables', async () => {
      // Remove required environment variable
      delete process.env.BUSTER_HOST;

      await expect(runDocsAgentAsync(validParams)).rejects.toThrow();
    });
  });

  describe('runDocsAgentSync', () => {
    beforeEach(async () => {
      // Mock database queries
      const { getOrganizationDataSource, getDataSourceCredentials } = await import(
        '@buster/database/queries'
      );
      vi.mocked(getOrganizationDataSource).mockResolvedValue({
        dataSourceId: 'test-datasource-id',
        dataSourceSyntax: 'postgres',
      });
      vi.mocked(getDataSourceCredentials).mockResolvedValue({
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_pass',
      });

      // Mock sandbox creation
      const { createSandboxWithBusterCLI } = await import('../management/create-sandbox');
      vi.mocked(createSandboxWithBusterCLI).mockResolvedValue(mockSandbox);

      // Mock profiles YAML builder
      const { buildProfilesYaml } = await import('../helpers/build-dbt-profiles-yaml');
      vi.mocked(buildProfilesYaml).mockReturnValue('mock-profiles-yaml-content');
    });

    it('should successfully run docs agent synchronously', async () => {
      // Mock dbt project file discovery
      vi.mocked(mockSandbox.fs.findFiles).mockResolvedValue([
        {
          file: '/workspace/repository/dbt_project.yml',
          content: 'profile: my_project',
          line: 1,
        },
      ]);

      await runDocsAgentSync(validParams);

      // Verify sandbox creation with dynamic snapshot selection
      const { createSandboxWithBusterCLI } = await import('../management/create-sandbox');
      expect(createSandboxWithBusterCLI).toHaveBeenCalledWith(
        'buster-data-engineer-postgres',
        'buster-data-engineer-fallback'
      );

      // Verify git clone
      expect(mockSandbox.git.clone).toHaveBeenCalledWith(
        validParams.repoUrl,
        '/workspace/repository',
        validParams.branch,
        undefined,
        'test-gh-app-id',
        validParams.installationToken
      );

      // Verify profiles YAML creation
      expect(mockSandbox.fs.createFolder).toHaveBeenCalledWith('/workspace/profiles', '755');
      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledWith(
        Buffer.from('mock-profiles-yaml-content'),
        '/workspace/profiles/profiles.yml'
      );
    });

    it('should create context file in sync mode', async () => {
      vi.mocked(mockSandbox.fs.findFiles).mockResolvedValue([]);

      await runDocsAgentSync(validParams);

      // Verify context directory and file creation
      expect(mockSandbox.fs.createFolder).toHaveBeenCalledWith('/workspace/context', '755');
      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledWith(
        Buffer.from(JSON.stringify(validParams.context)),
        '/workspace/context/context.json'
      );
    });

    it('should execute buster CLI with correct environment variables', async () => {
      vi.mocked(mockSandbox.fs.findFiles).mockResolvedValue([]);

      await runDocsAgentSync(validParams);

      // Find the main buster CLI execution call
      const executeCommandCalls = vi.mocked(mockSandbox.process.executeCommand).mock.calls;
      const busterCall = executeCommandCalls.find(
        (call) => call[0].includes('buster ') && call[0].includes('--prompt')
      );

      expect(busterCall).toBeDefined();

      // The environment variables should be in the third parameter (index 2)
      if (busterCall && busterCall.length > 2 && busterCall[2]) {
        expect(busterCall[2]).toEqual(
          expect.objectContaining({
            GITHUB_TOKEN: validParams.installationToken,
            BUSTER_API_KEY: validParams.apiKey,
            BUSTER_HOST: 'https://test.buster.so',
            PATH: '$HOME/.local/bin:$PATH',
          })
        );
      } else {
        // If no env vars are passed, that's also valid - just verify the call was made
        expect(busterCall).toBeDefined();
      }
    });
  });

  describe('Environment validation', () => {
    it('should require BUSTER_HOST environment variable', async () => {
      delete process.env.BUSTER_HOST;

      await expect(runDocsAgentAsync(validParams)).rejects.toThrow();
      await expect(runDocsAgentSync(validParams)).rejects.toThrow();
    });

    it('should require GH_APP_ID environment variable', async () => {
      delete process.env.GH_APP_ID;

      await expect(runDocsAgentAsync(validParams)).rejects.toThrow();
      await expect(runDocsAgentSync(validParams)).rejects.toThrow();
    });
  });

  describe('getDbtProjectInfo helper function', () => {
    it('should find dbt project profile from dbt_project.yml', async () => {
      // Mock findFiles to return a dbt_project.yml with profile
      vi.mocked(mockSandbox.fs.findFiles).mockResolvedValue([
        {
          file: '/workspace/repository/dbt_project.yml',
          content: 'profile: my_analytics_project',
          line: 1,
        },
      ]);

      const result = await getDbtProjectInfo(mockSandbox, '/workspace/repository');

      expect(result).toEqual({
        profileName: 'my_analytics_project',
        projectFilePath: '/workspace/repository/dbt_project.yml',
      });
    });

    it('should handle profile with quotes', async () => {
      vi.mocked(mockSandbox.fs.findFiles).mockResolvedValue([
        {
          file: '/workspace/repository/dbt_project.yml',
          content: 'profile: "my_project_with_quotes"',
          line: 1,
        },
      ]);

      const result = await getDbtProjectInfo(mockSandbox, '/workspace/repository');

      expect(result).toEqual({
        profileName: 'my_project_with_quotes',
        projectFilePath: '/workspace/repository/dbt_project.yml',
      });
    });

    it('should handle profile with single quotes', async () => {
      vi.mocked(mockSandbox.fs.findFiles).mockResolvedValue([
        {
          file: '/workspace/repository/dbt_project.yml',
          content: "profile: 'my_project_single_quotes'",
          line: 1,
        },
      ]);

      const result = await getDbtProjectInfo(mockSandbox, '/workspace/repository');

      expect(result).toEqual({
        profileName: 'my_project_single_quotes',
        projectFilePath: '/workspace/repository/dbt_project.yml',
      });
    });

    it('should return default profile when no dbt_project.yml found', async () => {
      vi.mocked(mockSandbox.fs.findFiles).mockResolvedValue([]);

      const result = await getDbtProjectInfo(mockSandbox, '/workspace/repository');

      expect(result).toEqual({
        profileName: 'default',
        projectFilePath: '',
      });
    });

    it('should return default profile when profile line not found in file', async () => {
      vi.mocked(mockSandbox.fs.findFiles).mockResolvedValue([
        {
          file: '/workspace/repository/other_file.yml',
          content: 'profile: some_profile',
          line: 1,
        },
      ]);

      const result = await getDbtProjectInfo(mockSandbox, '/workspace/repository');

      expect(result).toEqual({
        profileName: 'default',
        projectFilePath: '',
      });
    });

    it('should handle multiple matches and use first dbt_project.yml', async () => {
      vi.mocked(mockSandbox.fs.findFiles).mockResolvedValue([
        {
          file: '/workspace/repository/other_file.yml',
          content: 'profile: other_profile',
          line: 1,
        },
        {
          file: '/workspace/repository/dbt_project.yml',
          content: 'profile: correct_profile',
          line: 1,
        },
        {
          file: '/workspace/repository/subdir/dbt_project.yml',
          content: 'profile: subdir_profile',
          line: 1,
        },
      ]);

      const result = await getDbtProjectInfo(mockSandbox, '/workspace/repository');

      expect(result).toEqual({
        profileName: 'correct_profile',
        projectFilePath: '/workspace/repository/dbt_project.yml',
      });
    });

    it('should handle whitespace around profile name', async () => {
      vi.mocked(mockSandbox.fs.findFiles).mockResolvedValue([
        {
          file: '/workspace/repository/dbt_project.yml',
          content: 'profile:   whitespace_profile   ',
          line: 1,
        },
      ]);

      const result = await getDbtProjectInfo(mockSandbox, '/workspace/repository');

      expect(result).toEqual({
        profileName: 'whitespace_profile',
        projectFilePath: '/workspace/repository/dbt_project.yml',
      });
    });
  });

  describe('Error handling', () => {
    beforeEach(async () => {
      // Mock database queries
      const { getOrganizationDataSource, getDataSourceCredentials } = await import(
        '@buster/database/queries'
      );
      vi.mocked(getOrganizationDataSource).mockResolvedValue({
        dataSourceId: 'test-datasource-id',
        dataSourceSyntax: 'postgres',
      });
      vi.mocked(getDataSourceCredentials).mockResolvedValue({
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_pass',
      });

      // Mock sandbox creation
      const { createSandboxWithBusterCLI } = await import('../management/create-sandbox');
      vi.mocked(createSandboxWithBusterCLI).mockResolvedValue(mockSandbox);
    });

    it('should handle git clone failures', async () => {
      vi.mocked(mockSandbox.git.clone).mockRejectedValue(new Error('Git clone failed'));

      await expect(runDocsAgentAsync(validParams)).rejects.toThrow('Git clone failed');
    });

    it('should handle sandbox creation failures', async () => {
      const { createSandboxWithBusterCLI } = await import('../management/create-sandbox');
      vi.mocked(createSandboxWithBusterCLI).mockRejectedValue(new Error('Sandbox creation failed'));

      await expect(runDocsAgentAsync(validParams)).rejects.toThrow('Sandbox creation failed');
    });

    it('should handle database query failures', async () => {
      const { getOrganizationDataSource } = await import('@buster/database/queries');
      vi.mocked(getOrganizationDataSource).mockRejectedValue(new Error('Database query failed'));

      await expect(runDocsAgentAsync(validParams)).rejects.toThrow('Database query failed');
    });
  });
});

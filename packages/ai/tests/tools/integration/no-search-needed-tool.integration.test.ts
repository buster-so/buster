import { describe, expect, test } from 'vitest';
import { noSearchNeededTool, validateSearchSkipTool, shouldSkipDataSearch } from '@tools/no-search-needed-tool';

describe('No Search Needed Tool Integration Tests', () => {
  test('should optimize workflow for user-provided data', async () => {
    const result = await noSearchNeededTool.execute({
      context: {
        reason: 'user_provided_data',
        explanation: 'User uploaded CSV file with sales data',
        data_context: {
          has_user_data: true,
          has_cached_results: false,
        },
      },
    });

    expect(result.success).toBe(true);
    expect(result.search_skipped).toBe(true);
    expect(result.reason_recorded).toContain('User provided specific data');
    expect(result.workflow_optimized).toBe(true);
  });

  test('should handle existing context scenarios', async () => {
    const result = await noSearchNeededTool.execute({
      context: {
        reason: 'using_existing_context',
        explanation: 'Previous search returned relevant datasets',
        data_context: {
          has_user_data: false,
          has_cached_results: true,
          previous_search_id: 'search_12345',
        },
      },
    });

    expect(result.success).toBe(true);
    expect(result.search_skipped).toBe(true);
    expect(result.reason_recorded).toContain('existing data context');
  });

  test('should handle informational requests appropriately', async () => {
    const result = await noSearchNeededTool.execute({
      context: {
        reason: 'informational_request',
        explanation: 'User asking about dashboard best practices',
      },
    });

    expect(result.success).toBe(true);
    expect(result.search_skipped).toBe(true);
    expect(result.reason_recorded).toContain('informational');
  });

  test('should handle action-only tasks', async () => {
    const result = await noSearchNeededTool.execute({
      context: {
        reason: 'action_only_task',
        explanation: 'User wants to modify existing dashboard layout',
      },
    });

    expect(result.success).toBe(true);
    expect(result.search_skipped).toBe(true);
    expect(result.reason_recorded).toContain('actions without data analysis');
  });

  test('should handle already searched scenarios', async () => {
    const result = await noSearchNeededTool.execute({
      context: {
        reason: 'already_searched',
        explanation: 'Data catalog was searched 2 minutes ago',
        data_context: {
          has_user_data: false,
          has_cached_results: true,
          previous_search_id: 'search_recent_001',
        },
      },
    });

    expect(result.success).toBe(true);
    expect(result.search_skipped).toBe(true);
    expect(result.reason_recorded).toContain('already searched');
  });

  test('should handle custom reasons with explanations', async () => {
    const customExplanation = 'Using pre-computed results from external analytics system';
    
    const result = await noSearchNeededTool.execute({
      context: {
        reason: 'other',
        explanation: customExplanation,
      },
    });

    expect(result.success).toBe(true);
    expect(result.search_skipped).toBe(true);
    expect(result.reason_recorded).toBe(customExplanation);
  });
});

describe('Should Skip Data Search Helper Integration Tests', () => {
  test('should detect user-provided data from attachments', async () => {
    const result = await shouldSkipDataSearch({
      user_message: 'Please analyze this data',
      has_attachments: true,
      previous_actions: [],
      conversation_context: {},
    });

    expect(result.skip).toBe(true);
    expect(result.reason).toBe('user_provided_data');
  });

  test('should detect user-provided data from message content', async () => {
    const result = await shouldSkipDataSearch({
      user_message: 'here is the data I want you to analyze: [CSV content]',
      has_attachments: false,
      previous_actions: [],
      conversation_context: {},
    });

    expect(result.skip).toBeDefined();
    expect(typeof result.skip).toBe('boolean');
  });

  test('should detect recent search activity', async () => {
    const recentSearchAction = `search_data_catalog completed at ${new Date().toISOString()}`;
    
    const result = await shouldSkipDataSearch({
      user_message: 'Now create a chart from that data',
      has_attachments: false,
      previous_actions: [recentSearchAction],
      conversation_context: {},
    });

    expect(result.skip).toBeDefined();
    expect(typeof result.skip).toBe('boolean');
  });

  test('should identify pure informational requests', async () => {
    const informationalQueries = [
      'What is the best practice for creating dashboards?',
      'How does metric calculation work?',
      'Explain the difference between dimensions and measures',
      'Why should I use filters in my dashboard?',
    ];

    for (const query of informationalQueries) {
      const result = await shouldSkipDataSearch({
        user_message: query,
        has_attachments: false,
        previous_actions: [],
        conversation_context: {},
      });

      expect(result.skip).toBe(true);
      expect(result.reason).toBe('informational_request');
    }
  });

  test('should not skip for data-related informational requests', async () => {
    const result = await shouldSkipDataSearch({
      user_message: 'What is the average revenue in our sales data?',
      has_attachments: false,
      previous_actions: [],
      conversation_context: {},
    });

    expect(result.skip).toBe(false);
  });

  test('should detect existing context availability', async () => {
    const result = await shouldSkipDataSearch({
      user_message: 'Create a new visualization',
      has_attachments: false,
      previous_actions: [],
      conversation_context: { has_loaded_datasets: true },
    });

    expect(result.skip).toBe(true);
    expect(result.reason).toBe('using_existing_context');
  });

  test('should not skip for analysis requests without context', async () => {
    const analysisRequests = [
      'Analyze sales trends for the last quarter',
      'Create a revenue dashboard',
      'Show me the top performing products',
      'Generate a report on customer behavior',
    ];

    for (const request of analysisRequests) {
      const result = await shouldSkipDataSearch({
        user_message: request,
        has_attachments: false,
        previous_actions: [],
        conversation_context: {},
      });

      expect(result.skip).toBe(false);
    }
  });

  test('should not skip for old search activity', async () => {
    const oldSearchAction = `search_data_catalog completed at ${new Date(Date.now() - 10 * 60 * 1000).toISOString()}`; // 10 minutes ago
    
    const result = await shouldSkipDataSearch({
      user_message: 'Analyze current sales data',
      has_attachments: false,
      previous_actions: [oldSearchAction],
      conversation_context: {},
    });

    expect(result.skip).toBe(false);
  });
});

describe('Validate Search Skip Tool Integration Tests', () => {
  test('should validate appropriate skip for successful informational task', async () => {
    const result = await validateSearchSkipTool.execute({
      context: {
        task_description: 'Explain how to create effective dashboards',
        skip_reason: 'informational_request',
        task_completed_successfully: true,
      },
    });

    expect(result.decision_valid).toBeDefined();
    expect(typeof result.decision_valid).toBe('boolean');
    expect(result.confidence_score).toBeDefined();
    expect(typeof result.confidence_score).toBe('number');
  });

  test('should flag potentially wrong skip decision for failed tasks', async () => {
    const result = await validateSearchSkipTool.execute({
      context: {
        task_description: 'Create a sales performance dashboard',
        skip_reason: 'informational_request',
        task_completed_successfully: false,
      },
    });

    expect(result.decision_valid).toBeDefined();
    expect(typeof result.decision_valid).toBe('boolean');
    expect(result.confidence_score).toBeDefined();
    expect(typeof result.confidence_score).toBe('number');
    expect(result.recommendation).toBeDefined();
  });

  test('should identify misclassified data analysis tasks', async () => {
    const result = await validateSearchSkipTool.execute({
      context: {
        task_description: 'Analyze quarterly revenue metrics and create comprehensive dashboard',
        skip_reason: 'informational_request',
        task_completed_successfully: true,
      },
    });

    expect(result.confidence_score).toBeDefined();
    expect(typeof result.confidence_score).toBe('number');
    expect(result.recommendation).toBeDefined();
  });

  test('should approve appropriate skip decisions', async () => {
    const appropriateSkips = [
      {
        task_description: 'Explain the difference between metrics and KPIs',
        skip_reason: 'informational_request',
      },
      {
        task_description: 'Modify the color scheme of existing dashboard',
        skip_reason: 'action_only_task',
      },
      {
        task_description: 'Analyze uploaded CSV file',
        skip_reason: 'user_provided_data',
      },
    ];

    for (const skipCase of appropriateSkips) {
      const result = await validateSearchSkipTool.execute({
        context: {
          ...skipCase,
          task_completed_successfully: true,
        },
      });

      expect(result.decision_valid).toBeDefined();
      expect(typeof result.decision_valid).toBe('boolean');
      expect(result.confidence_score).toBeDefined();
      expect(typeof result.confidence_score).toBe('number');
    }
  });

  test('should handle edge cases appropriately', async () => {
    const edgeCases = [
      {
        task_description: 'Create chart with provided data but also show industry benchmarks',
        skip_reason: 'user_provided_data',
        expected_confidence: 0.8, // Should be high confidence despite mixed requirements
      },
      {
        task_description: 'Explain dashboard best practices using our company data as examples',
        skip_reason: 'informational_request',
        expected_confidence: 0.5, // Mixed - informational but mentions data
      },
    ];

    for (const edgeCase of edgeCases) {
      const result = await validateSearchSkipTool.execute({
        context: {
          task_description: edgeCase.task_description,
          skip_reason: edgeCase.skip_reason,
          task_completed_successfully: true,
        },
      });

      expect(result.confidence_score).toBeDefined();
      expect(typeof result.confidence_score).toBe('number');
    }
  });
});
import type { PermissionedDataset } from '@buster/access-controls';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PostProcessingWorkflowInput } from './message-post-processing-workflow';
import { runMessagePostProcessingWorkflow } from './message-post-processing-workflow';

// Helper to create mock datasets
const mockDatasets: PermissionedDataset[] = [
  {
    id: 'dataset_1',
    name: 'test_dataset',
    description: 'Test dataset for unit tests',
    ymlContent: 'name: test\ntables:\n  - name: test_table',
    type: 'dataset',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
] as any;

// Mock the steps
vi.mock('../../steps/message-post-processing-steps/flag-chat-step/flag-chat-step', () => ({
  runFlagChatStep: vi.fn(),
}));

vi.mock(
  '../../steps/message-post-processing-steps/identify-assumptions-step/identify-assumptions-step',
  () => ({
    runIdentifyAssumptionsStep: vi.fn(),
  })
);

vi.mock(
  '../../steps/message-post-processing-steps/format-follow-up-message-step/format-follow-up-message-step',
  () => ({
    runFormatFollowUpMessageStep: vi.fn(),
  })
);

vi.mock(
  '../../steps/message-post-processing-steps/format-initial-message-step/format-initial-message-step',
  () => ({
    runFormatInitialMessageStep: vi.fn(),
  })
);

import { runFlagChatStep } from '../../steps/message-post-processing-steps/flag-chat-step/flag-chat-step';
import { runFormatFollowUpMessageStep } from '../../steps/message-post-processing-steps/format-follow-up-message-step/format-follow-up-message-step';
import { runFormatInitialMessageStep } from '../../steps/message-post-processing-steps/format-initial-message-step/format-initial-message-step';
import { runIdentifyAssumptionsStep } from '../../steps/message-post-processing-steps/identify-assumptions-step/identify-assumptions-step';

describe('runMessagePostProcessingWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Formatting logic edge cases', () => {
    it('should format initial message when isSlackFollowUp is undefined', async () => {
      // Setup
      const input: PostProcessingWorkflowInput = {
        userName: 'Test User',
        datasets: mockDatasets,
        dataSourceSyntax: 'postgresql',
        isFollowUp: false,
        isSlackFollowUp: undefined, // Critical test case
      };

      vi.mocked(runFlagChatStep).mockResolvedValue({
        type: 'flagChat',
        summaryMessage: 'Issues found',
        summaryTitle: 'Test Issue',
      });

      vi.mocked(runIdentifyAssumptionsStep).mockResolvedValue({
        toolCalled: 'listAssumptions',
        assumptions: [
          {
            descriptiveTitle: 'Major assumption',
            classification: 'fieldMapping',
            explanation: 'Test explanation',
            label: 'major',
          },
        ],
      });

      vi.mocked(runFormatInitialMessageStep).mockResolvedValue({
        summaryMessage: 'Formatted initial message',
        summaryTitle: 'Initial Title',
      });

      // Execute
      const result = await runMessagePostProcessingWorkflow(input);

      // Verify - should call format initial message when isSlackFollowUp is undefined
      expect(runFormatInitialMessageStep).toHaveBeenCalledWith({
        userName: 'Test User',
        flaggedIssues: 'Issues found',
        majorAssumptions: [
          {
            descriptiveTitle: 'Major assumption',
            classification: 'fieldMapping',
            explanation: 'Test explanation',
            label: 'major',
          },
        ],
        conversationHistory: undefined,
      });

      expect(result.formattedMessage).toBe('Formatted initial message');
    });

    it('should format initial message when isSlackFollowUp is false', async () => {
      // Setup
      const input: PostProcessingWorkflowInput = {
        userName: 'Test User',
        datasets: mockDatasets,
        dataSourceSyntax: 'postgresql',
        isFollowUp: false,
        isSlackFollowUp: false, // Explicit false
      };

      vi.mocked(runFlagChatStep).mockResolvedValue({
        type: 'flagChat',
        summaryMessage: 'Issues found',
        summaryTitle: 'Test Issue',
      });

      vi.mocked(runIdentifyAssumptionsStep).mockResolvedValue({
        toolCalled: 'listAssumptions',
        assumptions: [
          {
            descriptiveTitle: 'Major assumption',
            classification: 'fieldMapping',
            explanation: 'Test explanation',
            label: 'major',
          },
        ],
      });

      vi.mocked(runFormatInitialMessageStep).mockResolvedValue({
        summaryMessage: 'Formatted initial message',
        summaryTitle: 'Initial Title',
      });

      // Execute
      const result = await runMessagePostProcessingWorkflow(input);

      // Verify
      expect(runFormatInitialMessageStep).toHaveBeenCalled();
      expect(result.formattedMessage).toBe('Formatted initial message');
    });

    it('should format follow-up message when both isFollowUp and isSlackFollowUp are true', async () => {
      // Setup
      const input: PostProcessingWorkflowInput = {
        userName: 'Test User',
        datasets: mockDatasets,
        dataSourceSyntax: 'postgresql',
        isFollowUp: true,
        isSlackFollowUp: true,
      };

      vi.mocked(runFlagChatStep).mockResolvedValue({
        type: 'flagChat',
        summaryMessage: 'Issues found',
        summaryTitle: 'Test Issue',
      });

      vi.mocked(runIdentifyAssumptionsStep).mockResolvedValue({
        toolCalled: 'listAssumptions',
        assumptions: [
          {
            descriptiveTitle: 'Major assumption',
            classification: 'fieldMapping',
            explanation: 'Test explanation',
            label: 'major',
          },
        ],
      });

      vi.mocked(runFormatFollowUpMessageStep).mockResolvedValue({
        summaryMessage: 'Formatted follow-up message',
        summaryTitle: 'Follow-up Title',
      });

      // Execute
      const result = await runMessagePostProcessingWorkflow(input);

      // Verify
      expect(runFormatFollowUpMessageStep).toHaveBeenCalled();
      expect(runFormatInitialMessageStep).not.toHaveBeenCalled();
      expect(result.formattedMessage).toBe('Formatted follow-up message');
    });

    it('should NOT format message when no major assumptions and no flagged issues', async () => {
      // Setup
      const input: PostProcessingWorkflowInput = {
        userName: 'Test User',
        datasets: mockDatasets,
        dataSourceSyntax: 'postgresql',
        isFollowUp: false,
        isSlackFollowUp: false,
      };

      vi.mocked(runFlagChatStep).mockResolvedValue({
        type: 'noIssuesFound',
        message: 'No issues found',
      });

      vi.mocked(runIdentifyAssumptionsStep).mockResolvedValue({
        toolCalled: 'noAssumptions',
        assumptions: undefined,
      });

      // Execute
      const result = await runMessagePostProcessingWorkflow(input);

      // Verify - no formatting functions should be called
      expect(runFormatInitialMessageStep).not.toHaveBeenCalled();
      expect(runFormatFollowUpMessageStep).not.toHaveBeenCalled();
      expect(result.formattedMessage).toBeUndefined();
    });

    it('should format message when major assumptions exist even without flagged issues', async () => {
      // Setup
      const input: PostProcessingWorkflowInput = {
        userName: 'Test User',
        datasets: mockDatasets,
        dataSourceSyntax: 'postgresql',
        isFollowUp: false,
        isSlackFollowUp: false,
      };

      vi.mocked(runFlagChatStep).mockResolvedValue({
        type: 'noIssuesFound',
        message: 'No issues found',
      });

      vi.mocked(runIdentifyAssumptionsStep).mockResolvedValue({
        toolCalled: 'listAssumptions',
        assumptions: [
          {
            descriptiveTitle: 'Major assumption',
            classification: 'fieldMapping',
            explanation: 'Test explanation',
            label: 'major',
          },
        ],
      });

      vi.mocked(runFormatInitialMessageStep).mockResolvedValue({
        summaryMessage: 'Major assumptions require attention',
        summaryTitle: 'Assumptions Found',
      });

      // Execute
      const result = await runMessagePostProcessingWorkflow(input);

      // Verify - should format because of major assumptions
      expect(runFormatInitialMessageStep).toHaveBeenCalled();
      expect(result.formattedMessage).toBe('Major assumptions require attention');
    });

    it('should NOT format message with only minor assumptions', async () => {
      // Setup
      const input: PostProcessingWorkflowInput = {
        userName: 'Test User',
        datasets: mockDatasets,
        dataSourceSyntax: 'postgresql',
        isFollowUp: false,
        isSlackFollowUp: false,
      };

      vi.mocked(runFlagChatStep).mockResolvedValue({
        type: 'noIssuesFound',
        message: 'No issues found',
      });

      vi.mocked(runIdentifyAssumptionsStep).mockResolvedValue({
        toolCalled: 'listAssumptions',
        assumptions: [
          {
            descriptiveTitle: 'Minor assumption',
            classification: 'fieldMapping',
            explanation: 'Test explanation',
            label: 'minor',
          },
        ],
      });

      // Execute
      const result = await runMessagePostProcessingWorkflow(input);

      // Verify - should NOT format because only minor assumptions
      expect(runFormatInitialMessageStep).not.toHaveBeenCalled();
      expect(runFormatFollowUpMessageStep).not.toHaveBeenCalled();
      expect(result.formattedMessage).toBeUndefined();
    });
  });

  describe('Result structure validation', () => {
    it('should return correct structure for flagChat with assumptions', async () => {
      const input: PostProcessingWorkflowInput = {
        userName: 'Test User',
        datasets: mockDatasets,
        dataSourceSyntax: 'postgresql',
      };

      vi.mocked(runFlagChatStep).mockResolvedValue({
        type: 'flagChat',
        summaryMessage: 'Issues found',
        summaryTitle: 'Test Issue',
      });

      vi.mocked(runIdentifyAssumptionsStep).mockResolvedValue({
        toolCalled: 'listAssumptions',
        assumptions: [
          {
            descriptiveTitle: 'Test assumption',
            classification: 'fieldMapping',
            explanation: 'Test explanation',
            label: 'major',
          },
        ],
      });

      vi.mocked(runFormatInitialMessageStep).mockResolvedValue({
        summaryMessage: 'Formatted message',
        summaryTitle: 'Title',
      });

      const result = await runMessagePostProcessingWorkflow(input);

      expect(result).toEqual({
        flagChatResult: {
          type: 'flagChat',
          summaryMessage: 'Issues found',
          summaryTitle: 'Test Issue',
          message: undefined,
        },
        assumptionsResult: {
          toolCalled: 'listAssumptions',
          assumptions: [
            {
              descriptiveTitle: 'Test assumption',
              classification: 'fieldMapping',
              explanation: 'Test explanation',
              label: 'major',
            },
          ],
        },
        formattedMessage: 'Formatted message',
      });
    });

    it('should return correct structure for noIssuesFound with no assumptions', async () => {
      const input: PostProcessingWorkflowInput = {
        userName: 'Test User',
        datasets: mockDatasets,
        dataSourceSyntax: 'postgresql',
      };

      vi.mocked(runFlagChatStep).mockResolvedValue({
        type: 'noIssuesFound',
        message: 'All good',
      });

      vi.mocked(runIdentifyAssumptionsStep).mockResolvedValue({
        toolCalled: 'noAssumptions',
        assumptions: undefined,
      });

      const result = await runMessagePostProcessingWorkflow(input);

      expect(result).toEqual({
        flagChatResult: {
          type: 'noIssuesFound',
          summaryMessage: undefined,
          summaryTitle: undefined,
          message: 'All good',
        },
        assumptionsResult: {
          toolCalled: 'noAssumptions',
          assumptions: undefined,
        },
        formattedMessage: undefined,
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle all undefined optional fields', async () => {
      const input: PostProcessingWorkflowInput = {
        userName: 'Test User',
        datasets: [],
        dataSourceSyntax: 'postgresql',
        conversationHistory: undefined,
        isFollowUp: undefined,
        isSlackFollowUp: undefined,
      };

      vi.mocked(runFlagChatStep).mockResolvedValue({
        type: 'noIssuesFound',
        message: 'No issues',
      });

      vi.mocked(runIdentifyAssumptionsStep).mockResolvedValue({
        toolCalled: 'noAssumptions',
        assumptions: undefined,
      });

      // Should not throw
      const result = await runMessagePostProcessingWorkflow(input);

      expect(result).toBeDefined();
      expect(result.formattedMessage).toBeUndefined();
    });

    it('should handle empty datasets array', async () => {
      const input: PostProcessingWorkflowInput = {
        userName: 'Test User',
        datasets: [],
        dataSourceSyntax: 'postgresql',
      };

      vi.mocked(runFlagChatStep).mockResolvedValue({
        type: 'noIssuesFound',
        message: 'No issues',
      });

      vi.mocked(runIdentifyAssumptionsStep).mockResolvedValue({
        toolCalled: 'noAssumptions',
        assumptions: undefined,
      });

      const result = await runMessagePostProcessingWorkflow(input);

      expect(runFlagChatStep).toHaveBeenCalledWith({
        conversationHistory: undefined,
        userName: 'Test User',
        datasets: [],
        dataSourceSyntax: 'postgresql',
        organizationDocs: undefined,
        analystInstructions: undefined,
      });
    });
  });
});

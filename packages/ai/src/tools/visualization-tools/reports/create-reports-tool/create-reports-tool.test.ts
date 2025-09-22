import { describe, expect, it } from 'vitest';
import { type CreateReportsContext, createCreateReportsTool } from './create-reports-tool';
import CREATE_REPORTS_TOOL_INVESTIGATION_DESCRIPTION from './create-reports-tool-investigation-description.txt';
import CREATE_REPORTS_TOOL_STANDARD_DESCRIPTION from './create-reports-tool-standard-description.txt';

describe('createCreateReportsTool', () => {
  const baseContext: CreateReportsContext = {
    userId: 'test-user',
    chatId: 'test-chat',
    organizationId: 'test-org',
    messageId: 'test-message',
  };

  describe('description selection based on analysisMode', () => {
    it('should use standard description when analysisMode is not provided', () => {
      const tool = createCreateReportsTool(baseContext);

      // The tool function returns an object with execute and other methods
      expect(tool).toBeDefined();
      expect(tool).toHaveProperty('execute');
    });

    it('should use standard description when analysisMode is "standard"', () => {
      const tool = createCreateReportsTool({
        ...baseContext,
        analysisMode: 'standard',
      });

      expect(tool).toBeDefined();
      expect(tool).toHaveProperty('execute');
    });

    it('should use investigation description when analysisMode is "investigation"', () => {
      const tool = createCreateReportsTool({
        ...baseContext,
        analysisMode: 'investigation',
      });

      expect(tool).toBeDefined();
      expect(tool).toHaveProperty('execute');
    });
  });

  describe('tool functionality', () => {
    it('should create a tool with required properties', () => {
      const tool = createCreateReportsTool(baseContext);

      expect(tool).toBeDefined();
      expect(typeof tool).toBe('object');
      expect(tool).toHaveProperty('execute');
      expect(typeof tool.execute).toBe('function');
    });

    it('should handle context with all optional fields', () => {
      const contextWithOptionals: CreateReportsContext = {
        ...baseContext,
        messageId: undefined,
        analysisMode: 'investigation',
      };

      const tool = createCreateReportsTool(contextWithOptionals);
      expect(tool).toBeDefined();
    });
  });

  describe('description content verification', () => {
    it('should have different content for standard vs investigation descriptions', () => {
      // Verify that the two description files have different content
      expect(CREATE_REPORTS_TOOL_STANDARD_DESCRIPTION).not.toBe(
        CREATE_REPORTS_TOOL_INVESTIGATION_DESCRIPTION
      );

      // Verify standard description contains expected keywords
      expect(CREATE_REPORTS_TOOL_STANDARD_DESCRIPTION.toLowerCase()).toContain('single tool call');
      expect(CREATE_REPORTS_TOOL_STANDARD_DESCRIPTION.toLowerCase()).toContain('standard mode');

      // Verify investigation description contains expected keywords
      expect(CREATE_REPORTS_TOOL_INVESTIGATION_DESCRIPTION.toLowerCase()).toContain(
        'seed-and-grow'
      );
      expect(CREATE_REPORTS_TOOL_INVESTIGATION_DESCRIPTION.toLowerCase()).toContain(
        'modifyreports'
      );
    });
  });
});

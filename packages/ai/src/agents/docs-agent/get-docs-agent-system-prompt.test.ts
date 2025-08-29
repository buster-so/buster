import { describe, expect, it } from 'vitest';
import docsAgentPrompt from './docs-agent-prompt.txt';
import { getDocsAgentSystemPrompt } from './get-docs-agent-system-prompt';

describe('Docs Agent Instructions', () => {
  it('should validate template file contains expected variables', () => {
    const content = docsAgentPrompt;

    // The current prompt file doesn't use template variables
    // Check that there are no unreplaced template variables
    const templateVariablePattern = /\{\{([^}]+)\}\}/g;
    const foundVariables = new Set<string>();

    const matches = Array.from(content.matchAll(templateVariablePattern));
    for (const match of matches) {
      if (match[1] && match[1] !== 'variable') {
        foundVariables.add(match[1]);
      }
    }

    // The current template doesn't have any variables
    expect(foundVariables.size).toBe(0);
  });

  it('should load and process the prompt template correctly', () => {
    const result = getDocsAgentSystemPrompt();

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);

    // The current implementation doesn't add any date to the prompt
    // It just returns the prompt as-is
    expect(result).toBe(docsAgentPrompt);
  });

  it('should contain expected sections from the prompt template', () => {
    const result = getDocsAgentSystemPrompt();

    // Check for key sections that should be in the prompt
    expect(result).toContain('<intro>');
    expect(result).toContain('<event_stream>');
    expect(result).toContain('<workflow_steps>');
    expect(result).toContain('<persistence>');
    expect(result).toContain('<playbook>');
    expect(result).toContain('<system_limitations>');
    expect(result).toContain('You are Buster');
  });

  it('should work without parameters', () => {
    // The function should work without any parameters
    expect(() => {
      getDocsAgentSystemPrompt();
    }).not.toThrow();

    const result = getDocsAgentSystemPrompt();
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

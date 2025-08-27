import { describe, expect, it } from 'vitest';
import docsAgentPrompt from './docs-agent-prompt.txt';
import { getDocsAgentSystemPrompt } from './get-docs-agent-system-prompt';

describe('Docs Agent Instructions', () => {
  it('should validate template file contains expected variables', () => {
    const content = docsAgentPrompt;

    // Expected template variables
    const expectedVariables = ['date'];

    // Find all template variables in the file
    const templateVariablePattern = /\{\{([^}]+)\}\}/g;
    const foundVariables = new Set<string>();

    const matches = Array.from(content.matchAll(templateVariablePattern));
    for (const match of matches) {
      if (match[1] && match[1] !== 'variable') {
        foundVariables.add(match[1]);
      }
    }

    // Convert to arrays for easier comparison
    const foundVariablesArray = Array.from(foundVariables).sort();
    const expectedVariablesArray = expectedVariables.sort();

    // Check that we have exactly the expected variables
    expect(foundVariablesArray).toEqual(expectedVariablesArray);

    // Also verify each expected variable exists
    for (const variable of expectedVariables) {
      expect(content).toMatch(new RegExp(`\\{\\{${variable}\\}\\}`));
    }

    // Ensure no unexpected variables exist
    expect(foundVariables.size).toBe(expectedVariables.length);
  });

  it('should load and process the prompt template correctly', () => {
    const result = getDocsAgentSystemPrompt();

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);

    // Should not contain any unreplaced template variables
    expect(result).not.toMatch(/\{\{date\}\}/);

    // Should contain a valid ISO date string
    const isoDatePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(result).toMatch(isoDatePattern);
  });

  it('should contain expected sections from the prompt template', () => {
    const result = getDocsAgentSystemPrompt();

    // Check for key sections that should be in the prompt
    expect(result).toContain('<intro>');
    expect(result).toContain('<event_stream>');
    expect(result).toContain('<agent_loop>');
    expect(result).toContain('<tools>');
    expect(result).toContain('<repository_structure>');
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

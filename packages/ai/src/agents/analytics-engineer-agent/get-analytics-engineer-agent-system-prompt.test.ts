import { describe, expect, it } from 'vitest';
import docsAgentPrompt from './analytics-engineer-agent-prompt.txt';
import { getDocsAgentSystemPrompt } from './get-analytics-engineer-agent-system-prompt';

describe('Docs Agent Instructions', () => {
  it('should load the prompt template', () => {
    const content = docsAgentPrompt;

    expect(content).toBeDefined();
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(1000);
  });

  it('should return a valid prompt string', () => {
    const result = getDocsAgentSystemPrompt();

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(1000);
  });
});

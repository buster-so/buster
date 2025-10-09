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
    const folderStructure = `
- src/
  - models/
    - users.yml
    - orders.yml
`;
    const result = getDocsAgentSystemPrompt(folderStructure);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(1000);
  });

  it('should throw an error for empty folder structure', () => {
    expect(() => {
      getDocsAgentSystemPrompt('');
    }).toThrow('Folder structure is required');

    expect(() => {
      getDocsAgentSystemPrompt('   '); // whitespace only
    }).toThrow('Folder structure is required');
  });
});

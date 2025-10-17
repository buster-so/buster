import analyticsEngineerAgentPrompt from './analytics-engineer-agent-prompt.txt';
import analyticsEngineerAgentSubagentPrompt from './analytics-engineer-agent-prompt-subagent.txt';

/**
 * Template parameters for the docs agent prompt
 */
export interface DocsAgentTemplateParams {
  folderStructure: string;
  date: string;
}

/**
 * Loads the docs agent prompt template and replaces variables
 */
function loadAndProcessPrompt(promptTemplate: string, params: DocsAgentTemplateParams): string {
  return promptTemplate
    .replace(/\{\{folder_structure\}\}/g, params.folderStructure)
    .replace(/\{\{date\}\}/g, params.date)
    .replace(/\{\{dbt_project_yml\}\}/g, ''); // Empty for now, can be populated later if needed
}

/**
 * Export the template function for use in agent files
 */
export const getDocsAgentSystemPrompt = (folderStructure: string): string => {
  if (!folderStructure.trim()) {
    throw new Error('Folder structure is required');
  }

  const currentDate = new Date().toISOString();

  return loadAndProcessPrompt(analyticsEngineerAgentPrompt, {
    folderStructure,
    date: currentDate,
  });
};

/**
 * Get system prompt for sub-agents (more concise, focused on task completion)
 */
export const getAnalyticsEngineerSubagentSystemPrompt = (folderStructure: string): string => {
  if (!folderStructure.trim()) {
    throw new Error('Folder structure is required');
  }

  const currentDate = new Date().toISOString();

  return loadAndProcessPrompt(analyticsEngineerAgentSubagentPrompt, {
    folderStructure,
    date: currentDate,
  });
};

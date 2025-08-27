import docsAgentFileTreePrompt from './docs-agent-file-tree-prompt.txt';

/**
 * Template parameters for the docs agent prompt
 */
export interface DocsAgentTemplateParams {
  fileTree: string;
}

/**
 * Loads the docs agent prompt template and replaces variables
 */
function loadAndProcessPrompt(params: DocsAgentTemplateParams): string {
  return docsAgentFileTreePrompt.replace(/\{\{file_tree\}\}/g, params.fileTree);
}

/**
 * Export the template function for use in agent files
 */
export const getDocsAgentFileTreeSystemPrompt = (fileTree: string): string => {
  return loadAndProcessPrompt({
    fileTree,
  });
};

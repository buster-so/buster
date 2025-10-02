import type { AnalysisMode } from '../../types/analysis-mode.types';
import analystAgentInvestigationPrompt from './analyst-agent-investigation-prompt.txt';
import analystAgentStandardPrompt from './analyst-agent-standard-prompt.txt';

/**
 * Template parameters for the analyst agent prompt
 */
export interface AnalystTemplateParams {
  dataSourceSyntax: string;
  date: string;
}

/**
 * Type-safe mapping of analysis modes to prompt content
 */
const PROMPTS: Record<AnalysisMode, string> = {
  standard: analystAgentStandardPrompt,
  investigation: analystAgentInvestigationPrompt,
} as const;

/**
 * Loads the analyst agent prompt template and replaces variables
 */
function loadAndProcessPrompt(
  params: AnalystTemplateParams,
  analysisMode: AnalysisMode = 'standard'
): string {
  const content = PROMPTS[analysisMode];

  return content
    .replace(/\{\{sql_dialect_guidance\}\}/g, params.dataSourceSyntax)
    .replace(/\{\{date\}\}/g, params.date);
}

/**
 * Export the template function for use in step files
 */
export const getAnalystAgentSystemPrompt = (
  dataSourceSyntax: string,
  analysisMode: AnalysisMode = 'standard'
): string => {
  if (!dataSourceSyntax.trim()) {
    throw new Error('SQL dialect guidance is required');
  }

  const currentDate = new Date().toISOString();

  return loadAndProcessPrompt(
    {
      dataSourceSyntax,
      date: currentDate,
    },
    analysisMode
  );
};

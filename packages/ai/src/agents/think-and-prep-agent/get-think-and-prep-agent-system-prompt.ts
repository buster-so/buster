import type { AnalysisMode } from '../../types/analysis-mode.types';
import thinkAndPrepInvestigationPrompt from './think-and-prep-agent-investigation-prompt.txt';
import thinkAndPrepStandardPrompt from './think-and-prep-agent-standard-prompt.txt';

/**
 * Template parameters for the think and prep agent prompt
 */
export interface ThinkAndPrepTemplateParams {
  sqlDialectGuidance: string;
  date: string;
}

/**
 * Type-safe mapping of analysis modes to prompt content
 */
const PROMPTS: Record<AnalysisMode, string> = {
  standard: thinkAndPrepStandardPrompt,
  investigation: thinkAndPrepInvestigationPrompt,
} as const;

/**
 * Loads the think and prep agent prompt template and replaces variables
 */
function loadAndProcessPrompt(
  params: ThinkAndPrepTemplateParams,
  analysisMode: AnalysisMode = 'standard'
): string {
  const content = PROMPTS[analysisMode];

  return content
    .replace(/\{\{sql_dialect_guidance\}\}/g, params.sqlDialectGuidance)
    .replace(/\{\{date\}\}/g, params.date);
}

/**
 * Export the template function for use in step files
 */
export const getThinkAndPrepAgentSystemPrompt = (
  sqlDialectGuidance: string,
  analysisMode: AnalysisMode = 'standard'
): string => {
  if (!sqlDialectGuidance.trim()) {
    throw new Error('SQL dialect guidance is required');
  }

  const currentDate = new Date().toISOString();

  return loadAndProcessPrompt(
    {
      sqlDialectGuidance,
      date: currentDate,
    },
    analysisMode
  );
};

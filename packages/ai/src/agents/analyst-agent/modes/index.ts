// Export all system prompts and related types
export * from './types';

// Re-export specific system prompts and injection functions for convenience
export {
  ANALYSIS_SYSTEM_PROMPT,
  injectAnalysisPrompt,
} from './analysis';

export {
  SEARCH_SYSTEM_PROMPT as DATA_CATALOG_SEARCH_SYSTEM_PROMPT,
  injectSearchPrompt as injectDataCatalogSearchPrompt,
} from './search';

export {
  PLANNING_SYSTEM_PROMPT,
  injectPlanningPrompt,
} from './planning';

export {
  REVIEW_SYSTEM_PROMPT,
  injectReviewPrompt,
} from './review';

// Export the base configuration system
export * from './analyst-base';

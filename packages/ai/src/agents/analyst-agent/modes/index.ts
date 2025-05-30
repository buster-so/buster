// Export all system prompts and related types
export * from './types';

// Re-export specific system prompts and injection functions for convenience
export {
  ANALYSIS_SYSTEM_PROMPT,
  injectAnalysisPrompt,
} from './analysis';

export {
  DATA_CATALOG_SEARCH_SYSTEM_PROMPT,
  injectDataCatalogSearchPrompt,
} from './data-catalog-search';

export {
  INITIALIZATION_SYSTEM_PROMPT,
  injectInitializationPrompt,
} from './initialization';

export {
  PLANNING_SYSTEM_PROMPT,
  injectPlanningPrompt,
} from './planning';

export {
  FOLLOW_UP_INITIALIZATION_SYSTEM_PROMPT,
  injectFollowUpInitializationPrompt,
} from './follow-up-initialization';

export {
  REVIEW_SYSTEM_PROMPT,
  injectReviewPrompt,
} from './review';

// Export the base configuration system
export * from './analyst-base';

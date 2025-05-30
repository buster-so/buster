import { anthropic } from '@ai-sdk/anthropic';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { wrapAISDKModel } from 'braintrust';

// Import specific functions from each mode
import {
  getInstructions as getAnalysisInstructions,
  getModel as getAnalysisModel,
  getTools as getAnalysisTools,
} from './analysis';
import {
  getInstructions as getDataCatalogSearchInstructions,
  getModel as getDataCatalogSearchModel,
  getTools as getDataCatalogSearchTools,
} from './data-catalog-search';
import {
  getInstructions as getFollowUpInitializationInstructions,
  getModel as getFollowUpInitializationModel,
  getTools as getFollowUpInitializationTools,
} from './follow-up-initialization';
import {
  getInstructions as getInitializationInstructions,
  getModel as getInitializationModel,
  getTools as getInitializationTools,
} from './initialization';
import {
  getInstructions as getPlanningInstructions,
  getModel as getPlanningModel,
  getTools as getPlanningTools,
} from './planning';
import {
  getInstructions as getReviewInstructions,
  getModel as getReviewModel,
  getTools as getReviewTools,
} from './review';

// Define the analyst agent modes
export enum AnalystMode {
  Initialization = 'initialization',
  DataCatalogSearch = 'data_catalog_search',
  Planning = 'planning',
  Analysis = 'analysis',
  Review = 'review',
  FollowUpInitialization = 'follow_up_initialization',
}

// Define the analyst agent runtime context
export interface AnalystRuntimeContext {
  // Shared data from ModeAgentData
  datasetWithDescriptions?: string[];
  todaysDate?: string;

  // State fields used in determine_agent_state function
  isFollowUp?: boolean;
  searchedDataCatalog?: boolean;
  dataContext?: string | null;
  planAvailable?: boolean;
  reviewNeeded?: boolean;
  userPrompt?: string;
  userId?: string;
  sessionId?: string;
}

// Define the analyst mode configuration
export interface AnalystModeConfiguration {
  instructions: string;
  model: any; // AI SDK model
  tools: Record<string, any>;
}

// Default model factory function
export const getDefaultModel = () => {
  return wrapAISDKModel(anthropic('claude-sonnet-4-20250514', {}));
};

// Determine analyst agent mode based on runtime context
export function determineAnalystMode(
  runtimeContext: RuntimeContext<AnalystRuntimeContext>
): AnalystMode {
  // Access the context data properly - it might be in state or context property
  const context = (runtimeContext as any)?.state || runtimeContext;

  // TODO: Implement the actual logic from determine_agent_state function
  // This is stubbed out as requested

  const isFollowUp = context.isFollowUp || false;
  const searchedCatalog = context.searchedDataCatalog || false;
  const hasDataContext = context.dataContext && context.dataContext.trim() !== '';
  const hasPlan = context.planAvailable || false;
  const needsReview = context.reviewNeeded || false;
  const hasUserPrompt = !!context.userPrompt;

  // Handle the state before the user provides their first prompt in this turn
  if (!hasUserPrompt && !isFollowUp) {
    return AnalystMode.Initialization;
  }

  // Review always takes precedence after user speaks
  if (needsReview) {
    return AnalystMode.Review;
  }

  // If we haven't searched the catalog yet, do that now
  if (!searchedCatalog) {
    return AnalystMode.DataCatalogSearch;
  }

  // If we have context but no plan, plan
  if (hasDataContext && !hasPlan) {
    return AnalystMode.Planning;
  }

  // If we have context and a plan, execute analysis
  if (hasDataContext && hasPlan) {
    return AnalystMode.Analysis;
  }

  // Fallback: If state is ambiguous after searching and no review needed
  if (searchedCatalog && !hasDataContext && !hasPlan) {
    return AnalystMode.Planning;
  }

  // Default fallback
  return AnalystMode.Initialization;
}

// Get analyst mode configuration based on the determined mode
export function getAnalystModeConfiguration(
  mode: AnalystMode,
  runtimeContext: RuntimeContext<AnalystRuntimeContext>
): AnalystModeConfiguration {
  switch (mode) {
    case AnalystMode.Initialization:
      return {
        instructions: getInitializationInstructions({ runtimeContext }),
        model: getInitializationModel({ runtimeContext }),
        tools: getInitializationTools({ runtimeContext }),
      };

    case AnalystMode.DataCatalogSearch:
      return {
        instructions: getDataCatalogSearchInstructions({ runtimeContext }),
        model: getDataCatalogSearchModel({ runtimeContext }),
        tools: getDataCatalogSearchTools({ runtimeContext }),
      };

    case AnalystMode.Planning:
      return {
        instructions: getPlanningInstructions({ runtimeContext }),
        model: getPlanningModel({ runtimeContext }),
        tools: getPlanningTools({ runtimeContext }),
      };

    case AnalystMode.Analysis:
      return {
        instructions: getAnalysisInstructions({ runtimeContext }),
        model: getAnalysisModel({ runtimeContext }),
        tools: getAnalysisTools({ runtimeContext }),
      };

    case AnalystMode.Review:
      return {
        instructions: getReviewInstructions({ runtimeContext }),
        model: getReviewModel({ runtimeContext }),
        tools: getReviewTools({ runtimeContext }),
      };

    case AnalystMode.FollowUpInitialization:
      return {
        instructions: getFollowUpInitializationInstructions({ runtimeContext }),
        model: getFollowUpInitializationModel({ runtimeContext }),
        tools: getFollowUpInitializationTools({ runtimeContext }),
      };

    default:
      throw new Error(`Unknown analyst mode: ${mode}`);
  }
}

// Main function to get analyst agent configuration
export function getAnalystConfiguration(runtimeContext: RuntimeContext<AnalystRuntimeContext>): {
  mode: AnalystMode;
  configuration: AnalystModeConfiguration;
} {
  const mode = determineAnalystMode(runtimeContext);
  const configuration = getAnalystModeConfiguration(mode, runtimeContext);

  return { mode, configuration };
}

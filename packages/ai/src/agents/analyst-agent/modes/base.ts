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

// Define the agent modes enum
export enum AgentMode {
  Initialization = 'initialization',
  DataCatalogSearch = 'data_catalog_search',
  Planning = 'planning',
  Analysis = 'analysis',
  Review = 'review',
  FollowUpInitialization = 'follow_up_initialization',
}

// Define the runtime context interface that matches the Rust ModeAgentData
export interface ModeRuntimeContext {
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

// Define the mode configuration interface
export interface ModeConfiguration {
  instructions: string;
  model: any; // AI SDK model
  tools: Record<string, any>;
}

// Default model factory function
export const getDefaultModel = () => {
  return wrapAISDKModel(anthropic('claude-sonnet-4-20250514', {}));
};

// Determine agent mode based on runtime context (stub implementation)
export function determineAgentMode(runtimeContext: RuntimeContext<ModeRuntimeContext>): AgentMode {
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
    return AgentMode.Initialization;
  }

  // Review always takes precedence after user speaks
  if (needsReview) {
    return AgentMode.Review;
  }

  // If we haven't searched the catalog yet, do that now
  if (!searchedCatalog) {
    return AgentMode.DataCatalogSearch;
  }

  // If we have context but no plan, plan
  if (hasDataContext && !hasPlan) {
    return AgentMode.Planning;
  }

  // If we have context and a plan, execute analysis
  if (hasDataContext && hasPlan) {
    return AgentMode.Analysis;
  }

  // Fallback: If state is ambiguous after searching and no review needed
  if (searchedCatalog && !hasDataContext && !hasPlan) {
    return AgentMode.Planning;
  }

  // Default fallback
  return AgentMode.Initialization;
}

// Get mode configuration based on the determined mode
export function getModeConfiguration(
  mode: AgentMode,
  runtimeContext: RuntimeContext<ModeRuntimeContext>
): ModeConfiguration {
  switch (mode) {
    case AgentMode.Initialization:
      return {
        instructions: getInitializationInstructions({ runtimeContext }),
        model: getInitializationModel({ runtimeContext }),
        tools: getInitializationTools({ runtimeContext }),
      };

    case AgentMode.DataCatalogSearch:
      return {
        instructions: getDataCatalogSearchInstructions({ runtimeContext }),
        model: getDataCatalogSearchModel({ runtimeContext }),
        tools: getDataCatalogSearchTools({ runtimeContext }),
      };

    case AgentMode.Planning:
      return {
        instructions: getPlanningInstructions({ runtimeContext }),
        model: getPlanningModel({ runtimeContext }),
        tools: getPlanningTools({ runtimeContext }),
      };

    case AgentMode.Analysis:
      return {
        instructions: getAnalysisInstructions({ runtimeContext }),
        model: getAnalysisModel({ runtimeContext }),
        tools: getAnalysisTools({ runtimeContext }),
      };

    case AgentMode.Review:
      return {
        instructions: getReviewInstructions({ runtimeContext }),
        model: getReviewModel({ runtimeContext }),
        tools: getReviewTools({ runtimeContext }),
      };

    case AgentMode.FollowUpInitialization:
      return {
        instructions: getFollowUpInitializationInstructions({ runtimeContext }),
        model: getFollowUpInitializationModel({ runtimeContext }),
        tools: getFollowUpInitializationTools({ runtimeContext }),
      };

    default:
      throw new Error(`Unknown agent mode: ${mode}`);
  }
}

// Main function to get agent configuration
export function getAgentConfiguration(runtimeContext: RuntimeContext<ModeRuntimeContext>): {
  mode: AgentMode;
  configuration: ModeConfiguration;
} {
  const mode = determineAgentMode(runtimeContext);
  const configuration = getModeConfiguration(mode, runtimeContext);

  return { mode, configuration };
}

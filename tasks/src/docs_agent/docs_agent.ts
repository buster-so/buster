import { logger, task, wait } from "@trigger.dev/sdk/v3";
import type { DocsAgentInput, DocsAgentOutput } from "./interfaces";

export const docsAgent = task({
  id: "docs-agent",
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload: DocsAgentInput, { ctx }): Promise<DocsAgentOutput> => {
    logger.log("Processing docs agent request", { 
      dataSourceId: payload.dataSourceId, 
      ctx 
    });

    // TODO: Add your docs processing logic here
    // You can access the dataSourceId via payload.dataSourceId

    return {
      message: "Docs agent processing completed successfully",
      dataSourceId: payload.dataSourceId,
    };
  },
});
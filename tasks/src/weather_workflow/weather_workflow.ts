import { logger, task } from '@trigger.dev/sdk/v3';
import { weatherWorkflow } from '../../../packages/ai/src/workflows/weather-workflow';
import type { WeatherAgentInput, WeatherAgentOutput } from './interfaces';

export const weatherWorkflowTask = task({
  id: 'weather-workflow',
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload: WeatherAgentInput, { ctx }): Promise<WeatherAgentOutput> => {
    logger.log('Processing weather workflow request', {
      location: payload.location,
      userId: payload.userId,
      ctx,
    });

    try {
      // Execute the weather workflow with the location
      const run = weatherWorkflow.createRun();
      const result = await run.start({ inputData: { city: payload.location } });

      if (result.status !== 'success') {
        // Handle non-success statuses (e.g., failed, suspended)
        logger.error('Weather workflow execution did not succeed', {
          location: payload.location,
          status: result.status,
          error: result.status === 'failed' ? result.error : undefined,
        });
        throw new Error(`Weather workflow failed with status: ${result.status}`);
      }

      logger.log('Weather workflow response received', {
        location: payload.location,
        responseLength: result.result.activities?.length || 0,
      });

      return {
        message: result.result.activities || 'No weather information available',
        location: payload.location,
        success: true,
        weatherData: result.result,
      };
    } catch (error) {
      logger.error('Weather workflow processing failed', {
        location: payload.location,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        message: 'Sorry, I encountered an error while getting the weather information.',
        location: payload.location,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

import { logger, task } from '@trigger.dev/sdk/v3';
import { weatherAgent } from '../../../packages/ai/src/agents/weather-agent';
import type { WeatherAgentInput, WeatherAgentOutput } from './interfaces';

export const weatherAgentTask = task({
  id: 'weather-agent',
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload: WeatherAgentInput, { ctx }): Promise<WeatherAgentOutput> => {
    logger.log('Processing weather agent request', {
      location: payload.location,
      userId: payload.userId,
      ctx,
    });

    try {
      // Prepare the message for the weather agent
      let message = `Get the weather for ${payload.location}`;

      // Add context if provided
      if (payload.context) {
        message = `${payload.context}\n\n${message}`;
      }

      // Execute the weather agent
      const response = await weatherAgent.generate(message);

      logger.log('Weather agent response received', {
        location: payload.location,
        responseLength: response.text?.length || 0,
      });

      return {
        message: response.text || 'No weather information available',
        location: payload.location,
        success: true,
        weatherData: response.toolResults || undefined,
      };
    } catch (error) {
      logger.error('Weather agent processing failed', {
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

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

      const response = await weatherAgent.stream(message, {
        maxSteps: 15,
        temperature: 1,
        threadId: 'testing',
        resourceId: 'testing-user',
        providerOptions: {
          anthropic: {
            thinking: { type: 'enabled', budgetTokens: 2000 },
          },
        },
        onChunk: (chunk) => {
          logger.log('Weather agent response chunk', {
            chunk,
          });
        },
      });

      // Collect the streamed text chunks
      let fullMessage = '';
      for await (const chunk of response.fullStream) {
        logger.log('Weather agent response chunk', {
          chunk,
        });
        fullMessage += chunk;
      }

      logger.log('Weather agent response received', {
        location: payload.location,
        responseLength: fullMessage.length,
      });

      return {
        message: fullMessage || 'No weather information available',
        location: payload.location,
        success: true,
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

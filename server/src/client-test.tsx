import { useEffect } from 'react';
import { hcWithType } from './client';

// Create a properly typed client using the pre-compiled types
const client = hcWithType('http://localhost:3002/');

export const TestComponent = () => {
  useEffect(() => {
    const run = async () => {
      // Debug: Check the client type
      console.log('Client type:', typeof client);
      console.log('Client object:', client);

      // Based on your route structure, the correct paths are:
      // - /healthcheck (from healthcheck routes)
      // - /api/v2/healthcheck (from v2 routes)
      // - /api/v2/hello (from v2 routes)

      try {
        // Test the main healthcheck endpoint
        const healthResponse = await client.healthcheck.$get();
        console.log('Health check:', await healthResponse.json());

        // Test the v2 healthcheck endpoint
        const v2HealthResponse = await client.api.v2.healthcheck.$get();
        console.log('V2 Health check:', await v2HealthResponse.json());

        // Test the v2 hello endpoint with query params
        const helloResponse = await client.api.v2.hello.$get({
          query: { name: 'World' }
        });
        console.log('Hello response:', await helloResponse.json());
      } catch (error) {
        console.error('API call failed:', error);
      }
    };

    run();
  }, []);
};

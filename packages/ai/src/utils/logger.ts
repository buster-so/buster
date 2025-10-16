import { initLogger } from 'braintrust';

/**
 * Initialize Braintrust logger with environment configuration
 * @param options Optional configuration to override defaults
 * @returns Initialized Braintrust logger
 */
export function initBraintrustLogger(options?: { apiKey?: string; projectName?: string }) {
  const apiKey = options?.apiKey || process.env.BRAINTRUST_KEY;
  const projectName = options?.projectName || process.env.ENVIRONMENT || 'development';

  if (!apiKey) {
    throw new Error('BRAINTRUST_KEY is not set');
  }

  return initLogger({
    apiKey,
    projectName,
  });
}

/**
 * Re-export initLogger from braintrust for direct access if needed
 */
export { initLogger } from 'braintrust';

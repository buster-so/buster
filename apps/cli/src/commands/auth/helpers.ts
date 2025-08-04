import type { Credentials } from './types.js';
// TODO: Import from lib when created
// import { apiClient } from '../../utils/api-client.js';
// import { configManager } from '../../utils/config.js';

export async function validateAndSaveCredentials(credentials: Credentials): Promise<void> {
  // TODO: Implement actual validation via API
  // const isValid = await apiClient.validateAuth(credentials);
  
  // Mock validation for now
  if (!credentials.apiKey || credentials.apiKey.length < 10) {
    throw new Error('Invalid API key');
  }
  
  // TODO: Save credentials
  // await configManager.saveCredentials(credentials);
  
  // Mock success
  await new Promise(resolve => setTimeout(resolve, 1000));
}
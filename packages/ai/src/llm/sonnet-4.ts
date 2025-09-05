import { gatewayModel } from './providers/gateway';

// Export Sonnet 4 model using AI Gateway
export const Sonnet4 = gatewayModel('anthropic/claude-4-sonnet-20250514');

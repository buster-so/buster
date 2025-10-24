import { gatewayModel } from './providers/gateway';

// Export Haiku 4.5 model using AI Gateway
export const Haiku45 = gatewayModel('anthropic/claude-4-5-haiku');

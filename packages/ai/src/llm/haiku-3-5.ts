import { gatewayModel } from './providers/gateway';

// Export Haiku 3.5 model using AI Gateway
export const Haiku35 = gatewayModel('anthropic/claude-3-5-haiku-20241022');

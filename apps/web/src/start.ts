import { createStart } from '@tanstack/react-start';
import { securityMiddleware } from './middleware/global-security';

export const startInstance = createStart(() => {
  return {
    functionMiddleware: [securityMiddleware],
  };
});

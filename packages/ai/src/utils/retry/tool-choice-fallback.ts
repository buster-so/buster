import type { CoreMessage } from 'ai';

/**
 * Tool choice fallback strategy constants and functions
 * When 'required' tool choice fails repeatedly, try with 'auto' or 'none'
 */

const FALLBACK_SEQUENCE: Array<'required' | 'auto' | 'none'> = ['required', 'auto', 'none'];

/**
 * Determines the next tool choice to try based on retry attempt
 */
export function getToolChoiceForRetry(
  originalToolChoice: 'required' | 'auto' | 'none' | undefined,
  retryAttempt: number
): 'required' | 'auto' | 'none' | undefined {
  // If original wasn't 'required', don't change it
  if (originalToolChoice !== 'required') {
    return originalToolChoice;
  }

  // For retry attempts, use the fallback sequence
  const fallbackIndex = Math.min(retryAttempt, FALLBACK_SEQUENCE.length - 1);
  return FALLBACK_SEQUENCE[fallbackIndex];
}

/**
 * Creates a healing message explaining the tool choice fallback
 */
export function createFallbackMessage(
  newToolChoice: 'required' | 'auto' | 'none' | undefined
): CoreMessage {
  let content: string;

  switch (newToolChoice) {
    case 'auto':
      content = 'Tool usage is now optional. You may use tools if helpful, or respond directly.';
      break;
    case 'none':
      content = 'Please respond without using any tools for now.';
      break;
    default:
      content = 'Please continue with your response.';
  }

  return {
    role: 'user',
    content,
  };
}

/**
 * Checks if error indicates tool choice should be adjusted
 */
export function shouldFallbackToolChoice(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const errorMessage = error.message.toLowerCase();

  return (
    errorMessage.includes('no tool calls') ||
    errorMessage.includes('required tool') ||
    errorMessage.includes('must call a tool') ||
    errorMessage.includes('tool choice') ||
    // Rate limiting might be due to complex tool usage
    errorMessage.includes('rate_limit') ||
    errorMessage.includes('429')
  );
}

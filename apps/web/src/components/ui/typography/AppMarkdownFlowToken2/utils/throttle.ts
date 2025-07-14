export const calculateAnimationInterval = (throttleRate: number): number => {
  const charsPerMs = throttleRate / 60000; // Convert rate to chars per ms
  return Math.max(1, 1 / charsPerMs); // Minimum 1ms between characters
};

export const calculateProgress = (currentLength: number, totalLength: number): number => {
  if (totalLength === 0) return 1;
  return Math.min(1, currentLength / totalLength);
};

export const createThrottleState = () => ({
  isAnimating: false,
  isPaused: false,
  currentIndex: 0,
  totalLength: 0,
});

export const shouldSkipAnimation = (
  content: string,
  isStreaming: boolean,
  enableThrottling: boolean = true
): boolean => {
  return !enableThrottling || (!isStreaming && content.length < 100);
};

export const getNextChunkSize = (
  remaining: number,
  isStreaming: boolean,
  throttleRate: number
): number => {
  // If not streaming and text is short, show all at once
  if (!isStreaming && remaining < 50) {
    return remaining;
  }
  
  // For streaming or longer text, show character by character
  return 1;
};

export const formatThrottleRate = (rate: number): string => {
  if (rate >= 1000) {
    return `${(rate / 1000).toFixed(1)}k chars/min`;
  }
  return `${rate} chars/min`;
};
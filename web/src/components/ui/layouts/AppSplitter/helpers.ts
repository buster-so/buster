export const createAutoSaveId = (id: string) => `app-splitter-${id}`;

// Helper function to convert size values to pixels
export const sizeToPixels = (size: string | number, containerSize: number): number => {
  if (typeof size === 'number') {
    return size;
  }

  const sizeStr = size.toString();

  if (sizeStr.endsWith('%')) {
    const percentage = parseFloat(sizeStr) / 100;
    return Math.round(containerSize * percentage);
  }

  if (sizeStr.endsWith('px')) {
    return parseFloat(sizeStr);
  }

  // Default to parsing as number
  return parseFloat(sizeStr) || 0;
};

// Ease-in-out cubic easing function
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const DEFAULT_LAYOUT = ['230px', 'auto'];

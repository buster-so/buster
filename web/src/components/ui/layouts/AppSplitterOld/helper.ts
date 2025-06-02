export const createAutoSaveId = (id: string) => `app-splitter-${id}`;

import Cookies from 'js-cookie';

export const setAppSplitterCookie = (key: string, value: string[]) => {
  Cookies.set(key, JSON.stringify(value), {
    expires: 365,
    secure: true,
    sameSite: 'strict'
  });
};

export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};

export const parseWidthValue = (width: string): { value: number; unit: 'px' | '%' } => {
  const match = width.match(/^(\d+(?:\.\d+)?)(px|%)$/);
  if (!match) throw new Error('Invalid width format. Must be in px or %');
  return {
    value: Number.parseFloat(match[1]),
    unit: match[2] as 'px' | '%'
  };
};

export const convertPxToPercentage = (px: number, containerWidth: number): number => {
  return (px / containerWidth) * 100;
};

export const convertPercentageToPx = (percentage: number, containerWidth: number): number => {
  return (percentage / 100) * containerWidth;
};

export const getCurrentSizePercentage = (
  size: string | number,
  otherSize: string | number,
  container: HTMLElement
): number => {
  if (size === 'auto') {
    // If this side is auto, calculate based on the other side
    const otherPercentage = getCurrentSizePercentage(otherSize, size, container);
    return 100 - otherPercentage;
  }

  if (typeof size === 'number') {
    return size;
  }

  // Handle percentage
  if (size.endsWith('%')) {
    return Number.parseFloat(size);
  }

  // Handle pixel values
  if (size.endsWith('px')) {
    const pixels = Number.parseFloat(size);
    return convertPxToPercentage(pixels, container.getBoundingClientRect().width);
  }

  return 0;
};

export const getCurrentSizesInPixels = (
  container: HTMLElement,
  sizes: [string | number | 'auto', string | number | 'auto']
): [number, number] => {
  if (!container) return [0, 0];
  const containerWidth = container.getBoundingClientRect().width;

  // Helper function to calculate size in pixels for a single side
  const calculateSizeInPixels = (size: string | number): number => {
    // If it's already a number, treat it as pixels
    if (typeof size === 'number') {
      return size;
    }

    // Parse the string value to get value and unit
    const { value, unit } = parseWidthValue(size);

    // If it's already in pixels, return the value directly
    if (unit === 'px') {
      return value;
    }

    // If it's a percentage, convert to pixels
    if (unit === '%') {
      return convertPercentageToPx(value, containerWidth);
    }

    return 0; // fallback
  };

  return sizes.map((size, index) => {
    // Handle 'auto' case
    if (size === 'auto') {
      // Get the other side's index (0 -> 1, 1 -> 0)
      const otherIndex = index === 0 ? 1 : 0;
      const otherSize = sizes[otherIndex];

      // If the other side is also auto, split equally
      if (otherSize === 'auto') {
        return containerWidth / 2;
      }

      // Calculate the other side's width in pixels
      const otherSizeInPixels = calculateSizeInPixels(otherSize);

      // Return the remaining width
      return containerWidth - otherSizeInPixels;
    }

    // For non-auto sizes, use the helper function
    return calculateSizeInPixels(size);
  }) as [number, number];
};

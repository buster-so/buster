export const createAutoSaveId = (id: string) => `app-splitter-${id}`;

import Cookies from 'js-cookie';

export const setAppSplitterCookie = (key: string, value: any) => {
  Cookies.set(key, JSON.stringify(value), {
    expires: 365,
    secure: true,
    sameSite: 'strict'
  });
};

export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

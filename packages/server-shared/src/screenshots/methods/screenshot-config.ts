const multiplier = 0.5;

export const DEFAULT_SCREENSHOT_CONFIG = {
  width: 1600 * multiplier,
  height: 900 * multiplier,
  type: 'webp' as const,
  deviceScaleFactor: 1.45,
};

export const DEFAULT_CHAT_SCREENSHOT_CONFIG = {
  ...DEFAULT_SCREENSHOT_CONFIG,
  width: 1200 * multiplier,
  height: 850 * multiplier,
};

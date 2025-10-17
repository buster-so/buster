const multiplier = 0.5;
const chatMultiplier = 0.6;

export const DEFAULT_SCREENSHOT_CONFIG = {
  width: 1600 * multiplier,
  height: 900 * multiplier,
  type: 'webp' as const,
  deviceScaleFactor: 1.6,
};

export const DEFAULT_CHAT_SCREENSHOT_CONFIG = {
  ...DEFAULT_SCREENSHOT_CONFIG,
  width: 1200 * chatMultiplier,
  height: 850 * chatMultiplier,
};

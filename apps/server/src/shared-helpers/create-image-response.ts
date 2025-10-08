import { DEFAULT_SCREENSHOT_CONFIG } from './screenshot-config';

export const createImageResponse = (
  imageBuffer: Buffer,
  type: 'png' | 'jpeg' = DEFAULT_SCREENSHOT_CONFIG.type
): Response => {
  return new Response(imageBuffer, {
    headers: {
      'Content-Type': `image/${type}`,
      'Content-Length': imageBuffer.length.toString(),
    },
  });
};

import type { Page } from 'playwright';
import sharp from 'sharp';

export const takeScreenshot = async ({ page, type }: { page: Page; type: 'png' | 'webp' }) => {
  const screenshotBuffer = await page.screenshot({ type: 'png' });
  if (type === 'png') {
    return await sharp(screenshotBuffer)
      .png({
        compressionLevel: 2,
        quality: 100,
      })
      .toBuffer();
  }

  const compressed = await sharp(screenshotBuffer)
    .webp({ nearLossless: true }) // Much smaller than PNG with same quality
    .toBuffer();
  return compressed;
};

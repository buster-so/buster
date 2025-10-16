import type { Page } from 'playwright';
import sharp from 'sharp';

const isDev = process.env.NODE_ENV === 'development';

export const takeScreenshot = async ({
  page,
  type,
}: {
  page: Page;
  type: 'png' | 'webp';
  width: number;
  height: number;
}) => {
  //this might look redundant but it's important to wait for the page to fully stabilize
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.waitForLoadState('load'),
    new Promise((resolve) => setTimeout(resolve, 200)),
  ]);
  await page.waitForLoadState('domcontentloaded');

  const screenshotBuffer = await page.screenshot({ type: 'png', animations: 'disabled' });

  if (type === 'png' && !isDev) {
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

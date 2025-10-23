/** biome-ignore-all lint/suspicious/noConsole: console.error is used for debugging */
import type { Page } from 'playwright';
import sharp from 'sharp';

const isDev = process.env.NODE_ENV === 'development';

export const takeScreenshot = async ({
  page,
  type,
  fullPath,
}: {
  page: Page;
  type: 'png' | 'webp';
  width: number;
  height: number;
  fullPath: string;
}) => {
  //this might look redundant but it's important to wait for the page to fully stabilize
  await new Promise((resolve) => setTimeout(resolve, 400)); //longer than the skeleton loader minimum
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.waitForLoadState('load'),
    new Promise((resolve) => setTimeout(resolve, 400)), //longer than the skeleton loader minimum
  ]);
  await page.waitForLoadState('domcontentloaded');
  await assertBeforeScreenshot(page, { fullPath });

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

export const assertBeforeScreenshot = async (page: Page, { fullPath }: { fullPath: string }) => {
  // Assert that "INTERNAL SERVER ERROR" does not show up on the page
  const pageContent = await page.content();
  if (pageContent.includes('INTERNAL SERVER ERROR')) {
    console.error('Page contains "INTERNAL SERVER ERROR" - refusing to take screenshot');
    throw new Error('Page contains "INTERNAL SERVER ERROR" - refusing to take screenshot');
  }

  // Assert that the page is at the expected full path
  const currentUrl = page.url();
  const expectedUrl = new URL(fullPath).pathname;
  const actualUrl = new URL(currentUrl).pathname;

  if (actualUrl !== expectedUrl) {
    console.error(`Page URL mismatch - expected path "${expectedUrl}" but got "${actualUrl}"`);
    throw new Error(`Page URL mismatch - expected path "${expectedUrl}" but got "${actualUrl}"`);
  }
};

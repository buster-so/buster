import type { Browser, Page } from 'playwright';
import { z } from 'zod';
import { getSupabaseCookieKey, getSupabaseUser } from '../../supabase/server';
import { DEFAULT_SCREENSHOT_CONFIG } from './screenshot-config';

type BrowserParamsBase<T> = {
  width?: number | undefined;
  height?: number | undefined;
  fullPath: string;
  callback: ({
    page,
    browser,
    width,
    height,
    type,
    fullPath,
  }: {
    page: Page;
    browser: Browser;
    width: number;
    height: number;
    fullPath: string;
    type: 'png' | 'webp';
  }) => Promise<T>;
};

export const BrowserParamsContextSchema = z.object({
  accessToken: z.string(),
  organizationId: z.string(),
  width: z.number().min(100).max(3840).default(DEFAULT_SCREENSHOT_CONFIG.width).optional(),
  height: z.number().min(100).max(7000).default(DEFAULT_SCREENSHOT_CONFIG.height).optional(),
  deviceScaleFactor: z
    .number()
    .min(1)
    .max(4)
    .default(DEFAULT_SCREENSHOT_CONFIG.deviceScaleFactor)
    .optional(),
  type: z.enum(['png', 'webp']).default(DEFAULT_SCREENSHOT_CONFIG.type).optional(),
});

export type BrowserParamsContext = z.infer<typeof BrowserParamsContextSchema>;

export type BrowserParams<T = Buffer<ArrayBufferLike>> = BrowserParamsContext &
  BrowserParamsBase<T>;

export const browserLogin = async <T = Buffer<ArrayBufferLike>>({
  width = DEFAULT_SCREENSHOT_CONFIG.width,
  height = DEFAULT_SCREENSHOT_CONFIG.height,
  fullPath,
  callback,
  accessToken,
  deviceScaleFactor,
  type,
}: BrowserParams<T>) => {
  if (!accessToken) {
    throw new Error('Missing Authorization header');
  }

  if (accessToken.split('.').length !== 3) {
    throw new Error('Invalid access token format');
  }

  const jwtPayload = JSON.parse(Buffer.from(accessToken.split('.')[1] || '', 'base64').toString());

  const [supabaseUser, chromium] = await Promise.all([
    getSupabaseUser(accessToken),
    import('playwright').then(({ chromium }) => chromium),
  ]);
  const supabaseCookieKey = getSupabaseCookieKey();

  if (!supabaseCookieKey) {
    throw new Error('Supabase cookie key not found');
  }

  if (!supabaseUser || supabaseUser?.is_anonymous) {
    throw new Error('User not authenticated', { cause: supabaseUser });
  }

  const browser = await chromium.launch();

  try {
    console.info('Creating browser context');
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: deviceScaleFactor || DEFAULT_SCREENSHOT_CONFIG.deviceScaleFactor, // High-DPI rendering for better quality screenshots
      locale: 'en-US',
      timezoneId: 'America/Denver',
    });
    console.info('Browser context created');

    // Format cookie value as Supabase expects: base64-<encoded_session>
    // Create a minimal session object to stay under cookie size limits (4KB)
    // Full user data can be fetched by the client using the access token
    const session = {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: jwtPayload.exp,
      refresh_token: '',
      user: {
        id: supabaseUser.id,
        aud: supabaseUser.aud,
        role: supabaseUser.role,
        email: supabaseUser.email,
      },
    };
    const cookieValue = `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`;
    const publicUrl = process.env.VITE_PUBLIC_URL;

    if (!publicUrl) {
      throw new Error('VITE_PUBLIC_URL environment variable is required for browser screenshots');
    }

    const url = new URL(publicUrl);

    // Ensure expires is a number (Unix timestamp in seconds)
    const expiresTimestamp =
      typeof jwtPayload.exp === 'number' ? jwtPayload.exp : Number.parseInt(jwtPayload.exp, 10);

    const cookieConfig: Parameters<typeof context.addCookies>[0][0] = {
      name: supabaseCookieKey,
      value: cookieValue,
      domain: url.hostname,
      path: '/',
      expires: expiresTimestamp,
      httpOnly: false,
      secure: url.protocol === 'https:',
      sameSite: 'Lax' as 'Strict' | 'Lax' | 'None',
    };
    console.info('Adding cookies');

    await context.addCookies([cookieConfig]);

    console.info('Creating new page');
    const page = await context.newPage();

    let pageError: Error | null = null;

    page.on('console', (msg) => {
      const text = msg.text();
      // React logs errors to console even when caught by error boundaries
      if (msg.type() === 'error' && (text.includes('Error:') || text.includes('occurred in'))) {
        pageError = new Error(`Page error: ${text}`);
      }
    });

    console.info('Navigating to fullPath');
    await page.goto(fullPath, { waitUntil: 'networkidle', timeout: 20000 });
    //wait for page to fully stabilize
    await new Promise((resolve) => setTimeout(resolve, 250));
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.waitForLoadState('domcontentloaded'),
      page.waitForLoadState('load'),
    ]);

    console.info('Callback');
    const result = await callback({
      page,
      browser,
      width,
      height,
      fullPath,
      type: type || DEFAULT_SCREENSHOT_CONFIG.type,
    });

    if (pageError) {
      throw pageError;
    }

    return { result };
  } catch (error) {
    console.error('Error logging in to browser', error);
    await browser.close();
    throw error;
  }
};

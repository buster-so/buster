import type { User } from '@supabase/supabase-js';
import type { Browser, Page } from 'playwright';
import { z } from 'zod';
import { getSupabaseCookieKey, getSupabaseUser } from '../../supabase/server';
import { DEFAULT_SCREENSHOT_CONFIG } from './screenshot-config';

type BrowserParamsBase<T> = {
  width?: number | undefined;
  height?: number | undefined;
  fullPath: string;
  callback: ({ page, browser }: { page: Page; browser: Browser }) => Promise<T>;
};

export const BrowserParamsContextSchema = z.object({
  accessToken: z.string(),
  organizationId: z.string(),
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

  if (!supabaseUser || supabaseUser?.is_anonymous || !supabaseCookieKey) {
    throw new Error('User not authenticated');
  }

  const session = {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: jwtPayload.exp,
    refresh_token: '',
    user: supabaseUser,
  };

  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({
      viewport: { width, height },
    });

    // Format cookie value as Supabase expects: base64-<encoded_session>
    const cookieValue = `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`;

    await context.addCookies([
      {
        name: supabaseCookieKey,
        value: cookieValue,
        domain: new URL(process.env.VITE_PUBLIC_URL || {}).hostname,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
    ]);

    const page = await context.newPage();

    let pageError: Error | null = null;

    page.on('console', (msg) => {
      const text = msg.text();
      // React logs errors to console even when caught by error boundaries
      if (msg.type() === 'error' && (text.includes('Error:') || text.includes('occurred in'))) {
        pageError = new Error(`Page error: ${text}`);
      }
    });

    await page.goto(fullPath, { waitUntil: 'networkidle' });
    console.info('Page loaded', { fullPath, height, width });

    const result = await callback({ page, browser });

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

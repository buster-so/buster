import type { Context } from 'hono';
import type { Browser, Page } from 'playwright';

export const browserLogin = async <T = Buffer<ArrayBufferLike>>({
  width,
  height,
  fullPath,
  callback,
  context,
}: {
  width: number;
  height: number;
  fullPath: string;
  callback: ({ page, browser }: { page: Page; browser: Browser }) => Promise<T>;
  context: Context;
}) => {
  const supabaseUser = context.get('supabaseUser');
  const supabaseCookieKey = context.get('supabaseCookieKey');
  const accessToken = context.get('accessToken');

  if (!accessToken) {
    throw new Error('Missing Authorization header');
  }

  if (accessToken.split('.').length !== 3) {
    throw new Error('Invalid access token format');
  }

  const jwtPayload = JSON.parse(Buffer.from(accessToken.split('.')[1] || '', 'base64').toString());

  if (!supabaseUser || supabaseUser?.is_anonymous) {
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

  const { chromium } = await import('playwright');
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

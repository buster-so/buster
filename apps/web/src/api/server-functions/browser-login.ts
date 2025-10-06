import { type Browser, chromium, type Page } from 'playwright';
import { env } from '@/env';
import { getSupabaseServerClient } from '@/integrations/supabase/server';

export const browserLogin = async <T = Buffer<ArrayBufferLike>>({
  accessToken,
  width,
  height,
  fullPath,
  request,
  callback,
}: {
  accessToken: string;
  width: number;
  height: number;
  fullPath: string;
  request: Request;
  callback: ({ page, browser }: { page: Page; browser: Browser }) => Promise<T>;
}) => {
  const supabase = getSupabaseServerClient();
  const jwtPayload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
  const origin = new URL(request.url).origin;

  const {
    data: { user },
  } = await supabase.auth.getUser(accessToken);

  if (!user || user?.is_anonymous) {
    throw new Error('User not found');
  }

  const session = {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: jwtPayload.exp,
    refresh_token: '',
    user: user,
  };

  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({
      viewport: { width, height },
    });

    const cookieKey = (supabase as unknown as { storageKey: string }).storageKey;

    // Format cookie value as Supabase expects: base64-<encoded_session>
    const cookieValue = `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`;

    await context.addCookies([
      {
        name: cookieKey,
        value: cookieValue,
        domain: new URL(env.VITE_PUBLIC_URL).hostname,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
    ]);

    const page = await context.newPage();
    const fullPathWithOrigin = `${origin}${fullPath}`;

    let pageError: Error | null = null;

    page.on('console', (msg) => {
      const text = msg.text();
      // React logs errors to console even when caught by error boundaries
      if (msg.type() === 'error' && (text.includes('Error:') || text.includes('occurred in'))) {
        pageError = new Error(`Page error: ${text}`);
      }
    });

    await page.goto(fullPathWithOrigin, { waitUntil: 'networkidle' });

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

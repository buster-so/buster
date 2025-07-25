import { NextResponse } from 'next/server';
import { isDev } from '@/config/dev';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code_challenge') || searchParams.get('code'); //we were not seeing code, just code_challenge?
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer

      if (isDev) {
        const redirectPath = next && next.startsWith('/') ? next : '/app';
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}/app`);
    }

    console.error('ERROR EXCHANGING CODE FOR SESSION :(', { error });
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

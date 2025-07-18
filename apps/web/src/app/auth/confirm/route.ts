import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash') || searchParams.get('code'); //THE SUPABASE DOCS ARE WRONG :(!
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash
    });
    if (!error) {
      // redirect user to specified redirect URL or root of app
      redirect(next);
      return;
    }

    console.error(error);
  }

  console.error('NO TOKEN HASH OR TYPE', { token_hash, type });

  // redirect the user to an error page with some instructions
  redirect('/auth/auth-code-error');
}

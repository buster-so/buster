'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { createSupabaseServerClient } from './server';

const authURLFull = `${process.env.NEXT_PUBLIC_URL}${createBusterRoute({
  route: BusterRoutes.AUTH_CALLBACK
})}`;

const isValidRedirectUrl = (url: string): boolean => {
  try {
    const decoded = decodeURIComponent(url);
    return decoded.startsWith('/') && !decoded.startsWith('//');
  } catch {
    return false;
  }
};

// Type for server action results
type ServerActionResult<T = void> = { success: true; data?: T } | { success: false; error: string };

export const signInWithEmailAndPassword = async ({
  email,
  password,
  redirectTo
}: {
  email: string;
  password: string;
  redirectTo?: string | null;
}): Promise<ServerActionResult> => {
  'use server';
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('supabase error', error);
    // Return the actual Supabase error message
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  const finalRedirect = redirectTo && isValidRedirectUrl(redirectTo) 
    ? decodeURIComponent(redirectTo)
    : createBusterRoute({ route: BusterRoutes.APP_HOME });
  return redirect(finalRedirect);
};

export const signInWithGoogle = async ({ redirectTo }: { redirectTo?: string | null } = {}): Promise<ServerActionResult<string>> => {
  'use server';

  const supabase = await createSupabaseServerClient();

  const callbackUrl = new URL(authURLFull);
  if (redirectTo && isValidRedirectUrl(redirectTo)) {
    callbackUrl.searchParams.set('next', redirectTo);
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString()
    }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return redirect(data.url);
};

export const signInWithGithub = async ({ redirectTo }: { redirectTo?: string | null } = {}): Promise<ServerActionResult<string>> => {
  'use server';

  const supabase = await createSupabaseServerClient();

  const callbackUrl = new URL(authURLFull);
  if (redirectTo && isValidRedirectUrl(redirectTo)) {
    callbackUrl.searchParams.set('next', redirectTo);
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: callbackUrl.toString()
    }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return redirect(data.url);
};

export const signInWithAzure = async ({ redirectTo }: { redirectTo?: string | null } = {}): Promise<ServerActionResult<string>> => {
  'use server';

  const supabase = await createSupabaseServerClient();

  const callbackUrl = new URL(authURLFull);
  if (redirectTo && isValidRedirectUrl(redirectTo)) {
    callbackUrl.searchParams.set('next', redirectTo);
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: callbackUrl.toString(),
      scopes: 'email'
    }
  });

  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath('/', 'layout');
  return redirect(data.url);
};

export const signUp = async ({
  email,
  password,
  redirectTo
}: {
  email: string;
  password: string;
  redirectTo?: string | null;
}): Promise<ServerActionResult> => {
  'use server';
  const supabase = await createSupabaseServerClient();
  const authURL = createBusterRoute({
    route: BusterRoutes.AUTH_CONFIRM
  });
  const authURLFull = `${process.env.NEXT_PUBLIC_URL}${authURL}`;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: authURLFull
    }
  });
  if (error) {
    console.error('supabase error in signUp', error);
    // Return the actual Supabase error message
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  const finalRedirect = redirectTo && isValidRedirectUrl(redirectTo) 
    ? decodeURIComponent(redirectTo)
    : createBusterRoute({ route: BusterRoutes.APP_HOME });
  return redirect(finalRedirect);
};

export const signInWithAnonymousUser = async () => {
  'use server';

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  revalidatePath('/', 'layout');

  return data;
};

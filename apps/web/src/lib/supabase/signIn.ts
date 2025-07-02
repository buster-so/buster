'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { createClient } from './server';

const authURLFull = `${process.env.NEXT_PUBLIC_URL}${createBusterRoute({
  route: BusterRoutes.AUTH_CALLBACK
})}`;

// Type for server action results
type ServerActionResult<T = void> = 
  | { success: true; data?: T }
  | { success: false; error: string };

export const signInWithEmailAndPassword = async ({
  email,
  password
}: {
  email: string;
  password: string;
}): Promise<ServerActionResult> => {
  'use server';
  const supabase = await createClient();

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
  return redirect(
    createBusterRoute({
      route: BusterRoutes.APP_HOME
    })
  );
};

export const signInWithGoogle = async (): Promise<ServerActionResult<string>> => {
  'use server';

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: authURLFull
    }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return redirect(data.url);
};

export const signInWithGithub = async (): Promise<ServerActionResult<string>> => {
  'use server';

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: authURLFull
    }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return redirect(data.url);
};

export const signInWithAzure = async (): Promise<ServerActionResult<string>> => {
  'use server';

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: authURLFull,
      scopes: 'email'
    }
  });

  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath('/', 'layout');
  return redirect(data.url);
};

export const signUp = async ({ email, password }: { email: string; password: string }): Promise<ServerActionResult> => {
  'use server';
  const supabase = await createClient();
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
  return redirect(
    createBusterRoute({
      route: BusterRoutes.APP_HOME
    })
  );
};

export const signInWithAnonymousUser = async () => {
  'use server';

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  revalidatePath('/', 'layout');

  return data;
};

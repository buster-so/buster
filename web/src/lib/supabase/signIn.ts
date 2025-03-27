'use server';

import { createClient } from './server';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const authURLFull = `${process.env.NEXT_PUBLIC_URL}${createBusterRoute({
  route: BusterRoutes.AUTH_CALLBACK
})}`;

export const signInWithEmailAndPassword = async ({
  email,
  password
}: {
  email: string;
  password: string;
}) => {
  'use server';

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return redirect(
    createBusterRoute({
      route: BusterRoutes.APP_HOME
    })
  );
};

export const signInWithGoogle = async () => {
  'use server';

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: authURLFull
    }
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return redirect(data.url);
};

export const signInWithGithub = async () => {
  'use server';

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: authURLFull
    }
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return redirect(data.url);
};

export const signInWithAzure = async () => {
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
    return { error: error.message };
  }
  revalidatePath('/', 'layout');
  return redirect(data.url);
};

export const signUp = async ({ email, password }: { email: string; password: string }) => {
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
    return { error: error.message };
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

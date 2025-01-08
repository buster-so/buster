import { headers } from 'next/headers';
import { createClient } from '@/context/Supabase/server';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes/busterRoutes';
import Cookies from 'js-cookie';

//TODO use google one click: https://supabase.com/docs/guides/auth/social-login/auth-google#google-pre-built

const authURLFull = `${process.env.NEXT_PUBLIC_URL}${createBusterRoute({
  route: BusterRoutes.AUTH_CALLBACK
})}`;

export const useBusterSupabaseAuthMethods = () => {
  const signInWithEmailAndPassword = async ({
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

    return redirect(
      createBusterRoute({
        route: BusterRoutes.APP_THREAD
      })
    );
  };

  const signInWithGoogle = async () => {
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

    return redirect(data.url);
  };

  const signInWithGithub = async () => {
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

    return redirect(data.url);
  };

  const signInWithAzure = async () => {
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

    return redirect(data.url);
  };

  const signUp = async ({ email, password }: { email: string; password: string }) => {
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
      console.error(error);
      return { error: error.message };
    }

    return redirect(
      createBusterRoute({
        route: BusterRoutes.APP_ROOT
      })
    );
  };

  const signInWithAnonymousUser = async () => {
    'use server';

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      throw error;
    }

    return data;
  };

  const signOut = async () => {
    'use server';

    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message };
    }

    setTimeout(() => {
      Object.keys(Cookies.get()).forEach((cookieName) => {
        Cookies.remove(cookieName);
      });
    }, 650);

    return redirect(
      createBusterRoute({
        route: BusterRoutes.AUTH_LOGIN
      })
    );
  };

  const resetPasswordEmailSend = async ({ email }: { email: string }) => {
    'use server';

    const supabase = await createClient();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authURLFull
    });

    if (error) {
      return { error: error.message };
    }

    return;
  };

  const resetPassword = async ({ password }: { password: string }) => {
    'use server';

    const supabase = await createClient();

    const { data, error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { error: error.message };
    }

    return;
  };

  return {
    signInWithAnonymousUser,
    signOut,
    signInWithEmailAndPassword,
    signInWithGoogle,
    signInWithGithub,
    signInWithAzure,
    signUp,
    resetPassword,
    resetPasswordEmailSend
  };
};

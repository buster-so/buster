'use server';

import { createClient } from './server';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { cookies } from 'next/headers';

export const signOut = async () => {
  'use server';
  const supabase = await createClient();
  const cookieStore = cookies();

  // Clear all cookies
  const allCookies = cookieStore.getAll();
  allCookies.forEach((cookie) => {
    cookieStore.delete(cookie.name);
  });

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return redirect(
    createBusterRoute({
      route: BusterRoutes.AUTH_LOGIN
    })
  );
};

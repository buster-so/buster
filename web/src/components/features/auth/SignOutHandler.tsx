'use client';

import { useCallback } from 'react';
import { signOut } from '@/lib/supabase/signOut';
import { clearAllBrowserStorage } from '@/lib/browser/storage';

export const useSignOut = () => {
  const handleSignOut = useCallback(async () => {
    // First clear all client-side storage
    clearAllBrowserStorage();

    // Then perform server-side sign out
    await signOut();
  }, []);

  return handleSignOut;
};

import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { getBrowserClient } from '@/integrations/supabase/client';
import { clearAllBrowserStorage } from '@/lib/storage';

const supabase = getBrowserClient();

export const useSignOut = () => {
  const { openErrorMessage } = useBusterNotifications();
  const navigate = useNavigate();
  const handleSignOut = useCallback(async () => {
    try {
      // Then perform server-side sign out
      await supabase.auth.signOut();
      try {
        // First clear all client-side storage
        clearAllBrowserStorage();
      } catch (error) {
        console.error('Error clearing browser storage', error);
      }
    } finally {
      navigate({ to: '/auth/login', reloadDocument: true, replace: true });
    }
  }, [navigate, openErrorMessage]);

  return handleSignOut;
};

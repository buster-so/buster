import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { signOut } from '@/integrations/supabase/signOut';
import { clearAllBrowserStorage } from '@/lib/storage';

export const useSignOut = () => {
  const { openErrorMessage } = useBusterNotifications();
  const navigate = useNavigate();
  const handleSignOut = useCallback(async () => {
    try {
      // Then perform server-side sign out
      await signOut();

      // First clear all client-side storage
      clearAllBrowserStorage();

      navigate({ to: '/auth/login' });

      // Clear all cookies
      for (const cookie of document.cookie.split(';')) {
        const cookieName = cookie.replace(/^ +/, '').split('=')[0];
        // biome-ignore lint/suspicious/noDocumentCookie: clearing cookies
        document.cookie = `${cookieName}=;expires=${new Date().toUTCString()};path=/`;
      }
    } catch (error) {
      openErrorMessage('Error signing out');
    }
  }, [navigate, openErrorMessage]);

  return handleSignOut;
};

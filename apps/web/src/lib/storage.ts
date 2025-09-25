import Cookies from 'js-cookie';
import { getQueryClient } from '@/integrations/tanstack-query/query-client';

/**
 * Clears all browser storage including localStorage, sessionStorage, cookies, and React Query cache
 * @returns void
 */
export const clearAllBrowserStorage = (): void => {
  // Clear React Query cache first
  try {
    const queryClient = getQueryClient();
    queryClient.clear(); // Removes all cached queries and mutations
    queryClient.getQueryCache().clear(); // Additional cleanup of query cache
    queryClient.getMutationCache().clear(); // Additional cleanup of mutation cache
  } catch (error) {
    console.warn('Failed to clear React Query cache:', error);
  }
  // Clear localStorage
  localStorage.clear();

  // Clear sessionStorage
  sessionStorage.clear();

  // Clear all cookies using js-cookie
  const cookieNames = Object.keys(Cookies.get());

  for (const cookieName of cookieNames) {
    // Remove with various path and domain combinations
    Cookies.remove(cookieName);
    Cookies.remove(cookieName, { path: '/' });
    Cookies.remove(cookieName, { path: '' });

    // Try removing with domain variations
    const currentDomain = window.location.hostname;
    Cookies.remove(cookieName, { path: '/', domain: currentDomain });
    Cookies.remove(cookieName, { path: '/', domain: `.${currentDomain}` });

    // Handle parent domain for subdomains
    const domainParts = currentDomain.split('.');
    if (domainParts.length > 1) {
      const parentDomain = domainParts.slice(-2).join('.');
      Cookies.remove(cookieName, { path: '/', domain: `.${parentDomain}` });
    }
  }
};

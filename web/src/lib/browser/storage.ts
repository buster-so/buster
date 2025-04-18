/**
 * Clears all browser storage including localStorage, sessionStorage, and cookies
 * @returns void
 */
export const clearAllBrowserStorage = (): void => {
  // Clear localStorage
  localStorage.clear();

  // Clear sessionStorage
  sessionStorage.clear();

  // Clear all cookies
  document.cookie.split(';').forEach((cookie) => {
    const cookieName = cookie.replace(/^ +/, '').split('=')[0];
    document.cookie = `${cookieName}=;expires=${new Date().toUTCString()};path=/`;
  });
};

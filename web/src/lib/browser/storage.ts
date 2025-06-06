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
  for (const cookie of document.cookie.split(';')) {
    const cookieName = cookie.replace(/^ +/, '').split('=')[0];

    // biome-ignore lint/suspicious/noDocumentCookie: I am using document.cookie here to clear cookies
    document.cookie = `${cookieName}=;expires=${new Date().toUTCString()};path=/`;
  }
};

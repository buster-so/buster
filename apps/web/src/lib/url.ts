export const getURLPathname = (url: string): string => {
  const parsedUrl = new URL(url);
  return parsedUrl.pathname.toString();
};

const ACCEPTED_DOMAINS = [
  process.env.NEXT_PUBLIC_URL,
  'twitter.com',
  'x.com',
  'youtube.com',
  'youtube-nocookie.com',
  'vimeo.com',
  'youtu.be'
];

/**
 * Checks if a URL is from an accepted domain
 * @param url - The URL string to validate
 * @returns boolean - true if the URL is from an accepted domain, false otherwise
 */
export function isUrlFromAcceptedDomain(url: string): boolean {
  try {
    console.log('url', url);
    const parsedUrl = new URL(url);
    console.log('parsedUrl', parsedUrl);
    return ACCEPTED_DOMAINS.some((accepted) => {
      try {
        // If accepted is a full URL, compare origins
        if (accepted?.startsWith('http') || accepted?.startsWith('https')) {
          const acceptedUrl = new URL(accepted);
          return parsedUrl.origin === acceptedUrl.origin;
        }
        // Otherwise, compare hostnames (e.g., 'youtube.com')
        return parsedUrl.hostname === accepted || parsedUrl.hostname.endsWith(`.${accepted}`);
      } catch {
        // If accepted is not a valid URL, fallback to hostname match
        return parsedUrl.hostname === accepted || parsedUrl.hostname.endsWith(`.${accepted}`);
      }
    });
  } catch {
    return false;
  }
}

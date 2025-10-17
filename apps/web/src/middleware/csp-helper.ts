import { env } from '@/env';

/**
 * Creates a Content Security Policy header with dynamic API URLs
 * @param isEmbed - Whether this is for an embed route (affects frame-ancestors)
 * @returns CSP header string
 */
export const createCspHeader = (isEmbed = false): string => {
  const apiUrl = new URL(env.VITE_PUBLIC_API_URL).origin;
  const api2Url = new URL(env.VITE_PUBLIC_API2_URL).origin;
  const profilePictureURL = 'https://googleusercontent.com';
  const publicUrlOrigin = new URL(env.VITE_PUBLIC_URL).origin;

  // Derive Supabase origins (HTTP and WS) from env so CSP allows them in all modes
  const supabaseUrl = env.VITE_PUBLIC_SUPABASE_URL;
  const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : '';
  const supabaseWsOrigin = supabaseUrl
    ? supabaseUrl.startsWith('https')
      ? supabaseOrigin.replace('https', 'wss')
      : supabaseOrigin.replace('http', 'ws')
    : '';

  const isDev = import.meta.env.DEV;
  const localDomains = isDev
    ? 'http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*'
    : '';

  return [
    // Default directives
    "default-src 'self'",
    // Scripts - includes 'unsafe-eval' for WebAssembly modules like Shiki
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.cloudflareinsights.com https://*.posthog.com https://us-assets.i.posthog.com https://eu-assets.i.posthog.com",
    // Styles
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    // Images
    "img-src 'self' blob: data: https: http:",
    // Fonts
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    // Frame ancestors - allow framing in development, restrict in production
    isEmbed
      ? `frame-ancestors 'self' *`
      : isDev
        ? `frame-ancestors 'self' *`
        : "frame-ancestors 'none'",
    // Frame sources - allow embeds from accepted domains
    `frame-src 'self' https://vercel.live https://*.twitter.com https://twitter.com https://*.x.com https://x.com https://*.youtube.com https://youtube.com https://*.youtube-nocookie.com https://youtube-nocookie.com https://*.youtu.be https://youtu.be https://*.vimeo.com https://vimeo.com ${publicUrlOrigin}`,
    // Connect sources for API calls
    (() => {
      const connectSources = [
        "'self'",
        'blob:',
        'data:', // Allow data URLs for PDF exports and other data URI downloads
        'https://*.vercel.app',
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://*.posthog.com',
        'https://us.i.posthog.com',
        'https://eu.i.posthog.com',
        'https://app.posthog.com',
        'https://us-assets.i.posthog.com',
        'https://eu-assets.i.posthog.com',
        'https://*.cloudflareinsights.com',
        'https://*.slack.com',
        // Speech recognition API and Google services
        'https://*.google.com',
        'https://*.googleapis.com',
        'https://apis.google.com',
        'https://ssl.gstatic.com',
        'https://www.google.com',
        'https://www.googletagmanager.com',
        'https://www.gstatic.com',
        'https://www.google-analytics.com',
        // Social media and video platform APIs for embeds
        'https://*.twitter.com',
        'https://twitter.com',
        'https://*.x.com',
        'https://x.com',
        'https://*.youtube.com',
        'https://youtube.com',
        'https://*.youtube-nocookie.com',
        'https://youtube-nocookie.com',
        'https://*.youtu.be',
        'https://youtu.be',
        'https://*.vimeo.com',
        'https://vimeo.com',
        'https://cdn.jsdelivr.net',
        apiUrl,
        api2Url,
        profilePictureURL,
        localDomains,
        supabaseOrigin,
        supabaseWsOrigin,
      ]
        .map((source) => source.replace(/\s+/g, ' ').trim())
        .filter(Boolean);

      return `connect-src ${connectSources.join(' ')}`;
    })(),
    // Media - allow media content from accepted domains
    "media-src 'self' https://*.twitter.com https://twitter.com https://*.x.com https://x.com https://*.youtube.com https://youtube.com https://*.youtube-nocookie.com https://youtube-nocookie.com https://*.youtu.be https://youtu.be https://*.vimeo.com https://vimeo.com",
    // Object
    "object-src 'none'",
    // Form actions
    "form-action 'self' https://*.slack.com https://*.posthog.com",
    // Base URI
    "base-uri 'self'",
    // Manifest
    "manifest-src 'self'",
    // Worker sources
    "worker-src 'self' blob: data: https://*.posthog.com https://us-assets.i.posthog.com https://eu-assets.i.posthog.com",
    // Child sources
    "child-src 'self' blob: data: https://*.posthog.com https://us-assets.i.posthog.com https://eu-assets.i.posthog.com",
  ].join('; ');
};

/**
 * Creates a complete set of security headers
 * @param isEr s for an embed route
 * @returns Object with security headers
 */
export const createSecurityHeaders = (isEmbed = false) => {
  return {
    'Content-Security-Policy': createCspHeader(isEmbed),
    'X-Frame-Options': isEmbed ? 'SAMEORIGIN' : 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Permissions-Policy': 'microphone=(self)',
  };
};

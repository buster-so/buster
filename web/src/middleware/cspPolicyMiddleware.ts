import { NextRequest } from 'next/server';

const cspHeader = {
  'Content-Security-Policy': [
    // Default directives
    "default-src 'self'",
    // Scripts
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app",
    // Styles
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Images
    "img-src 'self' blob: data: https://*.vercel.app https://*.supabase.co",
    // Fonts
    "font-src 'self' https://fonts.gstatic.com",
    // Frame ancestors
    "frame-ancestors 'none'",
    // Connect sources for API calls
    "connect-src 'self' https://*.vercel.app https://*.supabase.co wss://*.supabase.co",
    // Media
    "media-src 'self'",
    // Object
    "object-src 'none'",
    // Form actions
    "form-action 'self'",
    // Base URI
    "base-uri 'self'",
    // Manifest
    "manifest-src 'self'"
  ].join('; ')
};

export const cspPolicyMiddleware = (request: NextRequest) => {
  // Add CSP headers
  request.headers.set('Content-Security-Policy', cspHeader['Content-Security-Policy']);

  // Add additional security headers
  request.headers.set('X-Content-Type-Options', 'nosniff');
  request.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return request;
};

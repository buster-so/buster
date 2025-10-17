import { createMiddleware } from '@tanstack/react-start';
import { getRequest, getResponseHeaders } from '@tanstack/react-start/server';
import { createSecurityHeaders } from './csp-helper';

export const securityMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    try {
      // Check if this is an embed route by examining the request URL
      const request = getRequest();
      const url = new URL(request.url);
      const isEmbed = url.pathname.startsWith('/embed');

      const headers = getResponseHeaders();
      const securityHeaders = createSecurityHeaders(isEmbed);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      // Set appropriate cache headers for static assets
      const pathname = url.pathname;
      if (
        pathname.endsWith('.ico') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.jpeg') ||
        pathname.endsWith('.gif') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.woff') ||
        pathname.endsWith('.woff2') ||
        pathname.endsWith('.ttf') ||
        pathname.endsWith('.eot')
      ) {
        // Static assets with hashed filenames can be cached for 1 year
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (pathname === '/manifest.json') {
        // Manifest can be cached for a shorter time
        headers.set('Cache-Control', 'public, max-age=86400');
      }
    } catch (error) {
      // Ignore headers already sent errors to prevent crashes
      if (error instanceof Error && error.message.includes('ERR_HTTP_HEADERS_SENT')) {
        console.warn('Attempted to set security headers after headers sent');
      } else {
        // Log other errors but don't throw to avoid breaking the request
        console.error('Error in security middleware:', error);
      }
    }

    const result = await next();
    return result;
  }
);

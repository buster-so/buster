import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: defaultCspHeader
          }
        ]
      },
      {
        source: '/embed/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: embedCspHeader
          }
        ]
      }
    ];
  }
};

export default nextConfig;

const defaultCspHeader = [
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
  // Frame ancestors - no embedding for non-embed routes
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
].join('; ');

const embedCspHeader = [
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
  // Frame ancestors - allow embedding from any domain for /embed routes
  `frame-ancestors 'self' *`,
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
].join('; ');

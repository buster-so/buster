import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to create CSP header with dynamic API URLs
const createCspHeader = (isEmbed = false) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
    ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
    : '';
  const wsUrl = process.env.NEXT_PUBLIC_WEB_SOCKET_URL
    ? new URL(process.env.NEXT_PUBLIC_WEB_SOCKET_URL).origin
        .replace('https', 'wss')
        .replace('http', 'ws')
    : '';

  const isDev = process.env.NODE_ENV === 'development';
  const localDomains = isDev ? 'http://127.0.0.1:* ws://127.0.0.1:*' : '';

  return [
    // Default directives
    "default-src 'self'",
    // Scripts
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app https://cdn.jsdelivr.net https://*.cloudflareinsights.com https://*.posthog.com",
    // Styles
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    // Images
    "img-src 'self' blob: data: https://*.vercel.app https://*.supabase.co",
    // Fonts
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    // Frame ancestors
    isEmbed ? `frame-ancestors 'self' *` : "frame-ancestors 'none'",
    // Frame sources
    "frame-src 'self' https://vercel.live",
    // Connect sources for API calls
    `connect-src 'self' ${localDomains} https://*.vercel.app https://*.supabase.co wss://*.supabase.co https://*.posthog.com ${apiUrl} ${wsUrl}`.trim(),
    // Media
    "media-src 'self'",
    // Object
    "object-src 'none'",
    // Form actions
    "form-action 'self'",
    // Base URI
    "base-uri 'self'",
    // Manifest
    "manifest-src 'self'",
    // Worker sources
    "worker-src 'self' blob: data:",
    // Child sources
    "child-src 'self' blob: data:"
  ].join('; ');
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
    silenceDeprecations: ['legacy-js-api']
  },
  experimental: {
    serverComponentsExternalPackages: [],
    instrumentationHook: false,
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: createCspHeader(false)
          }
        ]
      },
      {
        source: '/embed/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: createCspHeader(true)
          }
        ]
      }
    ];
  }
};

// export default withBundleAnalyzer({
//   enabled: process.env.ANALYZE === 'true'
// })(nextConfig);

export default nextConfig;

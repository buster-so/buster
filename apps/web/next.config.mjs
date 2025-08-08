import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import env from './src/config/env.mjs';
import { withPostHogConfig } from '@posthog/nextjs-config';
import withBundleAnalyzer from '@next/bundle-analyzer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const apiUrl = new URL(env.NEXT_PUBLIC_API_URL).origin;
const api2Url = new URL(env.NEXT_PUBLIC_API2_URL).origin;
const profilePictureURL = 'https://googleusercontent.com';

// Function to create CSP header with dynamic API URLs
const createCspHeader = (isEmbed = false) => {
  const isDev = process.env.NODE_ENV === 'development';
  const localDomains = isDev
    ? 'http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*'
    : '';

  return [
    // Default directives
    "default-src 'self'",
    // Scripts
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app https://cdn.jsdelivr.net https://*.cloudflareinsights.com https://*.posthog.com",
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
    "frame-src 'self' https://vercel.live https://*.twitter.com https://twitter.com https://*.x.com https://x.com https://*.youtube.com https://youtube.com https://*.youtube-nocookie.com https://youtube-nocookie.com https://*.youtu.be https://youtu.be https://*.vimeo.com https://vimeo.com",
    // Connect sources for API calls
    (() => {
      const connectSources = [
        "'self'",
        'data:', // Allow data URLs for PDF exports and other data URI downloads
        localDomains,
        'https://*.vercel.app',
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://*.posthog.com',
        'https://*.slack.com',
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
        apiUrl,
        api2Url,
        profilePictureURL
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
    "form-action 'self' https://*.slack.com",
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
  // Transpile ESM packages
  transpilePackages: ['shiki'],
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_DISABLE_LINT === 'true' || process.env.CI === 'true',
    dirs: ['src']
  },
  // Disable TypeScript type checking during builds
  typescript: {
    ignoreBuildErrors: process.env.NEXT_DISABLE_TS_CHECK === 'true'
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
    silenceDeprecations: ['legacy-js-api']
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  webpack: (config) => {
    // Suppress the specific warning about critical dependencies in Supabase realtime-js
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message: /Critical dependency: the request of a dependency is an expression/
      }
    ];

    // Exclude .test and .stories files from webpack processing
    const originalEntry = config.entry;
    config.entry = async () => {
      const entry = await originalEntry();
      // Filter out test and story files from all entry points
      Object.keys(entry).forEach((key) => {
        if (Array.isArray(entry[key])) {
          entry[key] = entry[key].filter(
            (file) => !file.match(/\.(test|stories)\.(js|jsx|ts|tsx)$/)
          );
        }
      });
      return entry;
    };

    // Also exclude from module resolution
    config.module.rules.push({
      test: /\.(test|stories)\.(js|jsx|ts|tsx)$/,
      use: 'ignore-loader'
    });

    return config;
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

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
})(nextConfig);

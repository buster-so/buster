import MillionLint from '@million/lint';
/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars from parent directory in development
const envConfig = process.env.NODE_ENV === 'development' 
  ? dotenv.config({ path: '../.env' }).parsed 
  : {};

const nextConfig = {
  reactStrictMode: false,
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' blob: data: https://*.vercel.app https://*.supabase.co",
              "font-src 'self' https://fonts.gstatic.com",
              "frame-ancestors 'none'",
              "connect-src 'self' https://*.vercel.app https://*.supabase.co wss://*.supabase.co",
              "media-src 'self'",
              "object-src 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              "manifest-src 'self'"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
        ]
      }
    ];
  }
};

export default MillionLint.next({
  enabled: false,
  rsc: true
})(nextConfig);

//export default nextConfig;

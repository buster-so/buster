import MillionLint from '@million/lint';
/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig = {
  reactStrictMode: false,
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')]
  }
};

export default MillionLint.next({
  enabled: false,
  rsc: true
})(nextConfig);

//export default nextConfig;

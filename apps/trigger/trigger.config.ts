import * as fs from 'node:fs';
import * as path from 'node:path';
import { db } from '@buster/database';
import { esbuildPlugin } from '@trigger.dev/build/extensions';
import { defineConfig } from '@trigger.dev/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export default defineConfig({
  project: 'proj_lyyhkqmzhwiskfnavddk',
  runtime: 'node',
  logLevel: 'log',
  // The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
  // You can override this on an individual task.
  // See https://trigger.dev/docs/runs/max-duration
  maxDuration: 1200,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    external: ['lz4', 'xxhash'],
    extensions: [
      esbuildPlugin({
        name: 'buster-path-resolver',
        setup(build) {
          // Resolve all @buster/* imports
          build.onResolve({ filter: /^@buster\// }, (args) => {
            const fullPath = args.path.replace('@buster/', '');
            const parts = fullPath.split('/');
            const packageName = parts[0];
            const subPath = parts.slice(1).join('/');

            let resolvedPath: string;
            if (subPath) {
              // Handle sub-paths like @buster/server-shared/metrics
              // Check if subPath already starts with 'src', if so, don't add it again
              const cleanSubPath = subPath.startsWith('src/') ? subPath.slice(4) : subPath;
              const srcRoot = path.resolve(process.cwd(), '../..', 'packages', packageName, 'src');

              // Try multiple possible paths (combining both approaches)
              const candidatePaths = [
                path.join(srcRoot, `${cleanSubPath}.ts`),
                path.join(srcRoot, cleanSubPath, 'index.ts'),
                path.join(srcRoot, `${cleanSubPath}.tsx`),
                path.join(srcRoot, cleanSubPath, 'index.tsx'),
              ];

              const found = candidatePaths.find((p) => fs.existsSync(p));
              resolvedPath = found ?? path.join(srcRoot, cleanSubPath);
            } else {
              // Handle direct package imports like @buster/ai
              resolvedPath = path.resolve(
                process.cwd(),
                '../..',
                'packages',
                packageName,
                'src',
                'index.ts'
              );
            }

            return {
              path: resolvedPath,
              namespace: 'file',
            };
          });
        },
      }),
    ],
  },
  dirs: ['./src'],
});

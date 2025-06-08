import path from 'node:path';
import { esbuildPlugin } from '@trigger.dev/build/extensions';
import { defineConfig } from '@trigger.dev/sdk/v3';

export default defineConfig({
  project: 'proj_lyyhkqmzhwiskfnavddk',
  runtime: 'node',
  logLevel: 'log',
  // The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
  // You can override this on an individual task.
  // See https://trigger.dev/docs/runs/max-duration
  maxDuration: 3600,
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
            const packageName = args.path.replace('@buster/', '');
            const resolvedPath = path.resolve(
              process.cwd(),
              '..',
              'packages',
              packageName,
              'src',
              'index.ts'
            );

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

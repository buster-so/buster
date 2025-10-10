// // USE THIS TO BUILD A SNAPSHOT. YOU ONLY NEED TO RUN THIS ONCE AND THEN ALL FUTURE SANDBOXES CAN USE THE SNAPSHOT.

// import { Daytona, Image } from '@daytonaio/sdk';
// import { z } from 'zod';

// // Define schema for environment validation
// const envSchema = z.object({
//   DAYTONA_API_KEY: z.string().min(1, 'DAYTONA_API_KEY environment variable is required'),
// });

// async function buildSnapshot() {
//   const env = envSchema.parse(process.env);
//   const image = Image.fromDockerfile('src/build-snapshot/Dockerfile');

//   const daytona = new Daytona({ apiKey: env.DAYTONA_API_KEY, target: 'us' });

//   // Create a Snapshot with custom resources
//   await daytona.snapshot.create(
//     {
//       name: "buster-docs-agent-snapshot-all-deps",
//       image,
//       // All resource parameters are optional:
//       resources: {
//         cpu: 4,
//         memory: 8,
//         disk: 10,
//       },
//     },
//     { onLogs: console.log }
//   );
// }

// buildSnapshot();
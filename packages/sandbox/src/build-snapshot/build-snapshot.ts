// USE THIS TO BUILD SNAPSHOTS. YOU ONLY NEED TO RUN THIS ONCE AND THEN ALL FUTURE SANDBOXES CAN USE THE SNAPSHOTS.
// This will create separate snapshots for each dbt adapter to avoid version conflicts.

import { Daytona, Image } from '@daytonaio/sdk';
import { z } from 'zod';

// Define schema for environment validation
const envSchema = z.object({
  DAYTONA_API_KEY: z.string().min(1, 'DAYTONA_API_KEY environment variable is required'),
});

// Define the dbt adapters we want to build snapshots for
const dbtAdapters = [
  'postgres',
  'snowflake',
  'bigquery',
  'redshift',
  'databricks',
  'sqlserver',
  'mysql',
];

async function buildSnapshots() {
  const env = envSchema.parse(process.env);
  const daytona = new Daytona({ apiKey: env.DAYTONA_API_KEY, target: 'us' });

  console.log(`🚀 Building ${dbtAdapters.length} dbt adapter snapshots...`);

  // Build snapshots for each adapter in parallel
  const buildPromises = dbtAdapters.map(async (adapter) => {
    const dockerfilePath = `src/build-snapshot/Dockerfile.${adapter}`;
    const image = Image.fromDockerfile(dockerfilePath);
    const snapshotName = `buster-data-engineer-${adapter}`;

    console.log(`📦 Building snapshot: ${snapshotName}`);

    try {
      await daytona.snapshot.create(
        {
          name: snapshotName,
          image,
          // All resource parameters are optional:
          resources: {
            cpu: 4,
            memory: 8,
            disk: 10,
          },
        },
        {
          onLogs: (log) => console.log(`[${adapter}] ${log}`),
        }
      );
      console.log(`✅ Successfully built snapshot: ${snapshotName}`);
      return { adapter, success: true };
    } catch (error) {
      console.error(`❌ Failed to build snapshot for ${adapter}:`, error);
      return { adapter, success: false, error };
    }
  });

  // Wait for all builds to complete
  const results = await Promise.allSettled(buildPromises);

  // Report results
  console.log('\n📊 Build Results:');
  results.forEach((result, index) => {
    const adapter = dbtAdapters[index];
    if (result.status === 'fulfilled') {
      const { success } = result.value;
      console.log(`  ${success ? '✅' : '❌'} ${adapter}: ${success ? 'SUCCESS' : 'FAILED'}`);
    } else {
      console.log(`  ❌ ${adapter}: FAILED (${result.reason})`);
    }
  });

  const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
  console.log(`\n🎉 Built ${successful}/${dbtAdapters.length} snapshots successfully!`);
}

buildSnapshots().catch(console.error);

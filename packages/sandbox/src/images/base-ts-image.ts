import { Daytona, Image } from '@daytonaio/sdk';

const daytona = new Daytona();

const img = Image.base('node:20-bookworm-slim')
  .env({ DEBIAN_FRONTEND: 'noninteractive' })
  .runCommands(
    'apt-get update && apt-get install -y --no-install-recommends git curl ripgrep tree && rm -rf /var/lib/apt/lists/*',
    'groupadd -r daytona && useradd -r -g daytona -m daytona',
    'mkdir -p /home/daytona/workspace',
    'npm i -g typescript ts-node'
  )
  .dockerfileCommands(['USER daytona'])
  .workdir('/home/daytona/workspace')
  .entrypoint(['sh', '-lc', 'sleep infinity']);

await daytona.snapshot.create(
  { name: 'node-ts-tools', image: img },
  { onLogs: (m) => console.info(m) }
);

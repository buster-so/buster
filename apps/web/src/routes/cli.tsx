import { createFileRoute } from '@tanstack/react-router';

const GITHUB_RAW_SCRIPT_URL =
  'https://raw.githubusercontent.com/buster-so/buster/main/scripts/install.sh';

export const Route = createFileRoute('/cli')({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Fetch the install script from GitHub
          const response = await fetch(GITHUB_RAW_SCRIPT_URL);

          if (!response.ok) {
            console.error(
              `Failed to fetch install script: ${response.status} ${response.statusText}`
            );
            return new Response('Failed to fetch install script', {
              status: 502,
              headers: {
                'Content-Type': 'text/plain',
              },
            });
          }

          const scriptContent = await response.text();

          // Return the script with download headers
          return new Response(scriptContent, {
            status: 200,
            headers: {
              'Content-Type': 'application/x-sh',
              'Content-Disposition': 'attachment; filename="install.sh"',
              'Cache-Control': 'public, max-age=3600',
            },
          });
        } catch (error) {
          console.error('Error fetching install script:', error);
          return new Response('Internal server error', {
            status: 500,
            headers: {
              'Content-Type': 'text/plain',
            },
          });
        }
      },
    },
  },
});

export function createMockOctokit() {
  return {
    rest: {
      users: {
        getAuthenticated: () => Promise.resolve({
          status: 200,
          data: {
            id: 12345,
            login: 'testuser',
          },
        }),
      },
      apps: {
        listInstallationsForAuthenticatedUser: () => Promise.resolve({
          data: {
            installations: [
              {
                id: 67890,
                app_id: 123,
                permissions: {
                  contents: 'write',
                  pull_requests: 'write',
                },
              },
            ],
          },
        }),
        revokeInstallationAccessToken: () => Promise.resolve({
          status: 204,
        }),
      },
    },
  };
}

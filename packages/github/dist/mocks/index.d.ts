export declare function createMockOctokit(): {
    rest: {
        users: {
            getAuthenticated: () => Promise<{
                status: number;
                data: {
                    id: number;
                    login: string;
                };
            }>;
        };
        apps: {
            listInstallationsForAuthenticatedUser: () => Promise<{
                data: {
                    installations: {
                        id: number;
                        app_id: number;
                        permissions: {
                            contents: string;
                            pull_requests: string;
                        };
                    }[];
                };
            }>;
            revokeInstallationAccessToken: () => Promise<{
                status: number;
            }>;
        };
    };
};
//# sourceMappingURL=index.d.ts.map
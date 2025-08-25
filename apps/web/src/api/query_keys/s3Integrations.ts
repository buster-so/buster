export const s3IntegrationsQueryKeys = {
  s3IntegrationGet: {
    queryKey: ['s3-integrations', 'get'] as const
  },
  s3IntegrationsList: {
    queryKey: ['s3-integrations', 'list'] as const
  }
} as const;

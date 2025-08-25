// Main exports for server-shared package

// Export access controls with specific namespace to avoid conflicts
export * as AccessControls from './access-controls';

// Export other modules
export * from './assets';
export * from './chats';
export * from './dashboards';
export * from './dictionary';
export * from './github';
export * from './message';
export * from './metrics';
export * from './organization';
export * from './s3-integrations';
export * from './security';
// Export share module (has some naming conflicts with chats and metrics)
// TODO: Resolve naming conflicts properly
export * from './share';
export * from './slack';
export * from './teams';
export * from './title';
export * from './type-utilities';
export * from './user';

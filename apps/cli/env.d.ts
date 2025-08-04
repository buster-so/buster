/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    // API Configuration
    BUSTER_API_URL: string;
    BUSTER_API_KEY?: string;
    
    
    // CLI Configuration
    BUSTER_CONFIG_DIR?: string;
    BUSTER_CACHE_DIR?: string;
    
    // Feature Flags
    BUSTER_AUTO_UPDATE?: string;
    BUSTER_TELEMETRY_DISABLED?: string;
  }
}
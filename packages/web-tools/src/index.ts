// Main exports for the web-tools package
export { researchCompany } from './deep-research/company-research.js';
export { FirecrawlService } from './services/firecrawl.js';
export { pollJobStatus } from './utils/polling.js';

// Types
export type {
  CompanyResearch,
  CompanyResearchOptions,
  CompanyResearchError,
} from './deep-research/types.js';

export type { FirecrawlConfig } from './services/firecrawl.js';

export type { PollingOptions } from './utils/polling.js';

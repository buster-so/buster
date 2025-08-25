// Main exports for the web-tools package
export { researchCompany } from './deep-research/company-research';
export { FirecrawlService } from './services/firecrawl';
export { pollJobStatus } from './utils/polling';

// Types
export type {
  CompanyResearch,
  CompanyResearchOptions,
  CompanyResearchError,
} from './deep-research/types';

export type {
  FirecrawlConfig,
  WebSearchOptions,
  WebSearchResult,
  WebSearchResponse,
} from './services/firecrawl';

export type { PollingOptions } from './utils/polling';

// Main exports for the web-tools package
export { researchCompany } from './deep-research/company-research';
// Types
export type {
  CompanyResearch,
  CompanyResearchError,
  CompanyResearchOptions,
} from './deep-research/types';
export type {
  FirecrawlConfig,
  WebSearchOptions,
  WebSearchResponse,
  WebSearchResult,
} from './services/firecrawl';
export { FirecrawlService } from './services/firecrawl';
export type { PollingOptions } from './utils/polling';
export { pollJobStatus } from './utils/polling';

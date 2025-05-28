# Web Tools Package

A TypeScript package for web scraping and company research using Firecrawl's deep research API.

## Features

- **Company Research**: Research companies using their website URL to extract business information
- **Deep Research**: Uses Firecrawl's AI-powered deep research to gather comprehensive insights
- **Polling System**: Automatically polls job status with exponential backoff
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Comprehensive error handling with custom error types
- **Testing**: Complete test suite with unit and integration tests

## Installation

```bash
bun install
```

## Environment Variables

Set your Firecrawl API key:

```bash
export FIRECRAWL_API_KEY="fc-your-api-key-here"
```

Or create a `.env` file:

```
FIRECRAWL_API_KEY=fc-your-api-key-here
```

## Usage

### Basic Company Research

```typescript
import { researchCompany } from 'web-tools';

const result = await researchCompany('https://buster.so');

console.log(result.company);       // "Buster"
console.log(result.industry);      // "Technology"
console.log(result.businessModel); // "SaaS platform"
console.log(result.services);      // ["Analytics", "Data Platform"]
console.log(result.description);   // Full markdown description
console.log(result.keyInsights);   // Key insights array
```

### Research with Options

```typescript
import { researchCompany } from 'web-tools';

const result = await researchCompany('https://example.com', {
  includeFinancials: true,
  includeNews: true,
  focusAreas: ['technology', 'business-model'],
  maxWaitTime: 300000,    // 5 minutes
  pollingInterval: 5000,  // 5 seconds
});
```

### Using Individual Services

```typescript
import { FirecrawlService } from 'web-tools';

const firecrawl = new FirecrawlService();

// Start a deep research job
const jobId = await firecrawl.startDeepResearch('Research about AI startups', {
  maxDepth: 3,
  timeLimit: 180,
  maxUrls: 10,
});

// Check job status
const status = await firecrawl.getJobStatus(jobId);

// Simple URL scraping
const content = await firecrawl.scrapeUrl('https://example.com', {
  formats: ['markdown', 'html'],
  onlyMainContent: true,
});
```

## API Reference

### `researchCompany(url, options?)`

Research a company using their website URL.

**Parameters:**
- `url` (string): The company's website URL
- `options` (CompanyResearchOptions): Optional configuration

**Returns:** Promise<CompanyResearch>

### CompanyResearchOptions

```typescript
interface CompanyResearchOptions {
  maxWaitTime?: number;           // Maximum polling time (default: 300000ms)
  pollingInterval?: number;       // Polling interval (default: 5000ms)
  includeFinancials?: boolean;    // Include financial info (default: false)
  includeNews?: boolean;          // Include recent news (default: false)
  focusAreas?: string[];          // Focus on specific areas
}
```

### CompanyResearch

```typescript
interface CompanyResearch {
  company: string;                // Company name
  industry: string;               // Primary industry
  businessModel: string;          // How they make money
  services: string[];             // Products/services offered
  description: string;            // 2-4 paragraph description in markdown
  keyInsights: string[];          // Key insights for new employees
  url: string;                    // Original URL researched
  researchedAt: Date;             // When research was conducted
  rawData?: unknown;              // Raw research data from Firecrawl
}
```

### FirecrawlService

```typescript
class FirecrawlService {
  constructor(config?: FirecrawlConfig);
  
  // Start deep research job
  startDeepResearch(query: string, options?: DeepResearchOptions): Promise<string>;
  
  // Check job status
  getJobStatus(jobId: string): Promise<JobStatusResponse>;
  
  // Scrape single URL
  scrapeUrl(url: string, options?: ScrapeOptions): Promise<unknown>;
  
  // Validate URL accessibility
  validateUrl(url: string): Promise<boolean>;
}
```

## Error Handling

The package uses a custom `CompanyResearchError` class:

```typescript
try {
  const result = await researchCompany('https://example.com');
} catch (error) {
  if (error instanceof CompanyResearchError) {
    console.log('Error code:', error.code);     // 'TIMEOUT' | 'API_ERROR' | 'PARSE_ERROR' | 'INVALID_URL'
    console.log('Error message:', error.message);
    console.log('Error details:', error.details);
  }
}
```

## Testing

Run all tests:
```bash
bun run test
```

Run tests with UI:
```bash
bun run test:ui
```

Run tests with coverage:
```bash
bun run test:coverage
```

### Unit Tests
Located in `tests/unit/` - test individual components with mocked dependencies.

### Integration Tests
Located in `tests/integration/` - test the full flow with real API calls (requires valid FIRECRAWL_API_KEY).

## Development

Build the package:
```bash
bun run build
```

Run in development mode:
```bash
bun run dev
```

## Architecture

```
src/
├── index.ts                    # Main exports
├── services/
│   └── firecrawl.ts           # Firecrawl service wrapper
├── deep-research/
│   ├── types.ts               # TypeScript interfaces
│   └── company-research.ts    # Main research logic
└── utils/
    └── polling.ts             # Polling utilities
```

## Contributing

1. Follow TypeScript best practices
2. No `any` types - use proper interfaces or `unknown` with type guards
3. No `console.log` statements in production code
4. Write tests for new features
5. Use meaningful commit messages

## License

This package is part of the Buster project.

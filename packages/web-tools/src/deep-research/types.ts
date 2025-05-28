interface Source {
  url: string;
  title: string;
  description: string;
}

interface ResearchRawData {
  status?: string;
  data?: {
    status?: string;
    finalAnalysis?: string;
    sources?: Source[];
    activities?: Array<{
      type: string;
      status: string;
      message: string;
      timestamp: string;
      depth: number;
    }>;
    currentStep?: string;
    totalSteps?: number;
    progress?: number;
  };
  finalAnalysis?: string;
  sources?: Source[];
  error?: string;
}

export interface CompanyResearch {
  /** The raw analysis text from the research */
  analysis: string;
  /** Original URL researched */
  url: string;
  /** When the research was conducted */
  researchedAt: Date;
  /** Raw research data from Firecrawl */
  rawData: ResearchRawData;
}

export interface CompanyResearchOptions {
  /** Maximum time to wait for job completion in milliseconds */
  maxWaitTime?: number;
  /** Polling interval in milliseconds */
  pollingInterval?: number;
  /** Include financial information if available */
  includeFinancials?: boolean;
  /** Include recent news/updates */
  includeNews?: boolean;
  /** Focus on specific aspects */
  focusAreas?: ('business-model' | 'services' | 'culture' | 'technology' | 'market-position')[];
}

export class CompanyResearchError extends Error {
  constructor(
    message: string,
    public readonly code: 'TIMEOUT' | 'API_ERROR' | 'PARSE_ERROR' | 'INVALID_URL' = 'API_ERROR',
    public readonly details?: ResearchRawData | Error | string
  ) {
    super(message);
    this.name = 'CompanyResearchError';
  }
}

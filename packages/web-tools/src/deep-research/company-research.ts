import { FirecrawlService } from '../services/firecrawl';
import { pollJobStatus } from '../utils/polling';
import { type CompanyResearch, CompanyResearchError, type CompanyResearchOptions } from './types';

interface ResearchResult {
  status?: string;
  data?: {
    status?: string;
    finalAnalysis?: string;
    sources?: Array<{
      url: string;
      title: string;
      description: string;
    }>;
    error?: string;
  };
  finalAnalysis?: string;
  sources?: Array<{
    url: string;
    title: string;
    description: string;
  }>;
  error?: string;
}

/**
 * Research a company using their website URL
 */
export async function researchCompany(
  url: string,
  options: CompanyResearchOptions = {}
): Promise<CompanyResearch> {
  const {
    maxWaitTime = 300000, // 5 minutes default
    pollingInterval = 5000, // 5 seconds default
  } = options;

  // Validate URL format
  if (!isValidUrl(url)) {
    throw new CompanyResearchError(`Invalid URL format: ${url}`, 'INVALID_URL');
  }

  const firecrawl = await FirecrawlService.create();

  try {
    // Create a focused research query for the company
    const query = buildResearchQuery(url);

    const analysisPrompt = `Provide a concise, data-driven analysis (4-5 paragraphs) focused on key business insights. The report should:

  - What the company does at a high level
  - What their products and services are
  - How those products and services are used
  - How do they make money

  Things we don't need to know:
  - Company marketing copy like vision, mission, values, etc.
  - We don't need to know about the company's history or team.
  - Legal information like trademarks, patents, etc.


Avoid marketing language or unnecessary details. This analysis will be used for strategic decision-making and business consulting purposes.

You must output in organized markdown format. Consisting of 3-6 sections. Each of those sections can leverage subheaders, bullet points, and anything that makes it well organized.`;

    const systemPrompt = `You are a data/ontology/analytics consultant at Palantir. Your goal is to thoroughly understand the company's business operations, including their business model, products, services, features, use cases, and value proposition. Always begin your research by analyzing the company's website when provided, as it contains the most authoritative and up-to-date information about their business. This research will be used to inform your consulting work and help you provide strategic insights and recommendations.
    
    Your goal is to understand:
      - What the company does at a high level
  - What their products and services are
  - How those products and services are used
  - How do they make money

  Things we don't need to know:
  - Company marketing copy like vision, mission, values, etc.
  - We don't need to know about the company's history or team.
  - Legal information like trademarks, patents, etc.`;

    // Start the deep research job
    const jobResult = await firecrawl.startDeepResearch(query, {
      systemPrompt,
      analysisPrompt,
    });

    let result: ResearchResult;

    // Check if we got immediate results or need to poll
    if (typeof jobResult === 'string') {
      // We got a job ID, need to poll for completion
      result = await pollJobStatus(
        jobResult,
        (id) => firecrawl.getJobStatus(id),
        (status) => isJobCompleted(status),
        (status) => isJobFailed(status),
        (status) => getJobErrorMessage(status),
        {
          interval: pollingInterval,
          maxWaitTime,
          maxInterval: 30000, // Cap at 30 seconds
          backoffMultiplier: 1.2,
        }
      );
    } else {
      // We got immediate results
      result = jobResult as ResearchResult;
    }

    // Extract the analysis text and return it directly
    const analysisText = result?.data?.finalAnalysis || result?.finalAnalysis || '';

    if (!analysisText) {
      throw new CompanyResearchError(
        'No research results returned from Firecrawl',
        'PARSE_ERROR',
        result
      );
    }

    return {
      analysis: analysisText,
      url,
      researchedAt: new Date(),
      rawData: result,
    };
  } catch (error) {
    if (error instanceof CompanyResearchError) {
      throw error;
    }

    throw new CompanyResearchError(
      `Failed to research company: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'API_ERROR',
      error instanceof Error ? error : String(error)
    );
  }
}

/**
 * Build a focused research query for the company
 */
function buildResearchQuery(url: string): string {
  const domain = new URL(url).hostname;
  const companyName = domain.replace(/^www\./, '').split('.')[0];

  const query = `
  Research the company ${companyName}, starting with their website at: ${domain}.

  Once again, you should start with the company's website and then use other sources to understand the company's business model.

  WEBSITE: ${url}
`;

  return query;
}

/**
 * Check if job is completed based on Firecrawl response structure
 */
function isJobCompleted(status: ResearchResult): boolean {
  const statusValue = status?.status || status?.data?.status;
  return statusValue === 'completed' || statusValue === 'done' || statusValue === 'finished';
}

/**
 * Check if job failed based on Firecrawl response structure
 */
function isJobFailed(status: ResearchResult): boolean {
  const statusValue = status?.status || status?.data?.status;
  return statusValue === 'failed' || statusValue === 'error';
}

/**
 * Get error message from job status
 */
function getJobErrorMessage(status: ResearchResult): string {
  return status?.error || status?.data?.error || 'Unknown error occurred';
}

/**
 * Simple URL validation
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

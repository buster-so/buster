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
    includeFinancials = false,
    includeNews = false,
    focusAreas = ['business-model', 'services'],
  } = options;

  // Validate URL format
  if (!isValidUrl(url)) {
    throw new CompanyResearchError(`Invalid URL format: ${url}`, 'INVALID_URL');
  }

  const firecrawl = new FirecrawlService();

  // Validate that the URL is accessible
  const isAccessible = await firecrawl.validateUrl(url);
  if (!isAccessible) {
    throw new CompanyResearchError(`URL is not accessible or scrapeable: ${url}`, 'INVALID_URL');
  }

  try {
    // Create a focused research query for the company
    const query = buildResearchQuery(url, { includeFinancials, includeNews, focusAreas });

    // Start the deep research job
    const jobResult = await firecrawl.startDeepResearch(query, {
      maxDepth: 3, // Not too deep to keep it focused
      timeLimit: 180, // 3 minutes
      maxUrls: 8, // Limited number of URLs to keep it concise
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
function buildResearchQuery(
  url: string,
  options: { includeFinancials?: boolean; includeNews?: boolean; focusAreas?: string[] }
): string {
  const domain = new URL(url).hostname;
  const companyName = domain.replace(/^www\./, '').split('.')[0];

  let query = `Research the company ${companyName}, starting with their website at: ${domain}. I need to understand:
- What industry they operate in
- Their core business model and how they make money
- What products or services they offer
- Key information a new employee should know about the company
- Key summary about the company.`;

  if (options.includeFinancials) {
    query += '\n- Recent financial performance and business metrics';
  }

  if (options.includeNews) {
    query += '\n- Recent news and company updates';
  }

  if (options.focusAreas?.length) {
    query += `\n- Focus particularly on: ${options.focusAreas.join(', ')}`;
  }

  query +=
    '\n\nProvide a comprehensive but concise overview suitable for onboarding new team members.';

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

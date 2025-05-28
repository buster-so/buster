import { FirecrawlService } from '../services/firecrawl.js';
import { pollJobStatus } from '../utils/polling.js';
import {
  type CompanyResearch,
  CompanyResearchError,
  type CompanyResearchOptions,
} from './types.js';

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

    // Extract and structure the company information
    return await extractCompanyInfo(result, url);
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

  let query = `Research ${companyName} company at ${domain}. I need to understand:
- What industry they operate in
- Their core business model and how they make money
- What products or services they offer
- Key information a new employee should know about the company`;

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
 * Extract company information from the research results
 */
async function extractCompanyInfo(
  result: ResearchResult,
  originalUrl: string
): Promise<CompanyResearch> {
  // Extract the final analysis or data from the Firecrawl response
  const analysisText = result?.data?.finalAnalysis || result?.finalAnalysis || '';

  if (!analysisText) {
    throw new CompanyResearchError(
      'No research results returned from Firecrawl',
      'PARSE_ERROR',
      result
    );
  }

  // Parse the analysis text to extract structured information
  return parseAnalysisText(analysisText, originalUrl, result);
}

/**
 * Parse the analysis text and extract structured company information
 */
function parseAnalysisText(
  analysisText: string,
  url: string,
  rawData: ResearchResult
): CompanyResearch {
  // Extract company name from URL as primary method
  const domain = new URL(url).hostname;
  const domainParts = domain.replace(/^www\./, '').split('.');
  const domainCompanyName = domainParts[0] || 'unknown';

  // Capitalize the first letter for better presentation
  let company = domainCompanyName.charAt(0).toUpperCase() + domainCompanyName.slice(1);

  // Only try to enhance the company name if we find a clear match
  const lowerAnalysis = analysisText.toLowerCase();
  const lowerDomainName = domainCompanyName.toLowerCase();

  // Look for the domain name mentioned in the text (case insensitive)
  if (lowerAnalysis.includes(lowerDomainName)) {
    // Find the capitalized version in the original text
    const domainRegex = new RegExp(`\\b${domainCompanyName}\\b`, 'gi');
    const matches = analysisText.match(domainRegex);
    if (matches?.[0]) {
      company = matches[0];
    }
  }

  // Extract industry with improved patterns
  const industryPatterns = [
    /(?:industry|sector|field)[:\s]+([^\n\.,]{5,50})/i,
    /operates in the ([^\n\.,]{5,50})\s+(?:industry|sector|field)/i,
    /\b(?:AI|data|analytics|technology|software|platform|business intelligence)\b/i,
  ];

  let industry = 'Technology'; // Default fallback
  for (const pattern of industryPatterns) {
    const match = analysisText.match(pattern);
    if (match?.[1] && match[1].trim().length > 4) {
      industry = match[1].trim();
      break;
    }
    if (match?.[0] && !match[1]) {
      // For patterns that don't have capture groups (like the third pattern)
      industry = match[0];
      break;
    }
  }

  // Extract business model info with better patterns
  const businessModelPatterns = [
    /(?:business model|revenue model|makes money)[:\s]+([^\n\.]{10,200})/i,
    /(?:monetizes|generates revenue)[:\s]+([^\n\.]{10,200})/i,
    /\b(?:SaaS|subscription|open.?source|freemium|enterprise)\b/i,
  ];

  let businessModel = 'Not specified';
  for (const pattern of businessModelPatterns) {
    const match = analysisText.match(pattern);
    if (match?.[1] && match[1].trim().length > 5) {
      businessModel = match[1].trim();
      break;
    }
    if (match?.[0] && !match[1]) {
      // For patterns that don't have capture groups
      businessModel = match[0];
      break;
    }
  }

  // Extract services with improved keyword detection
  const servicesText = analysisText.toLowerCase();
  const services: string[] = [];
  const serviceKeywords = [
    'ai data analyst',
    'analytics platform',
    'dashboard',
    'data visualization',
    'business intelligence',
    'query engine',
    'data exploration',
    'software',
    'platform',
    'service',
    'product',
    'solution',
    'tool',
    'application',
  ];

  for (const keyword of serviceKeywords) {
    if (servicesText.includes(keyword)) {
      services.push(
        keyword
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      );
    }
  }

  // Remove duplicates and limit to reasonable number
  const uniqueServices = [...new Set(services)].slice(0, 6);

  // If no services found, add a generic one
  if (uniqueServices.length === 0) {
    uniqueServices.push('Digital services');
  }

  // Create key insights from the analysis
  const keyInsights = [
    `Company operates in the ${industry.toLowerCase()} industry`,
    `Business model: ${businessModel}`,
    `Offers: ${uniqueServices.join(', ').toLowerCase()}`,
  ];

  return {
    company,
    industry,
    businessModel,
    services: uniqueServices,
    description: analysisText,
    keyInsights,
    url,
    researchedAt: new Date(),
    rawData,
  };
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

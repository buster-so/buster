import { beforeAll, describe, expect, it } from 'vitest';
import { researchCompany } from '../../src/deep-research/company-research.js';
import { CompanyResearchError } from '../../src/deep-research/types.js';

// Skip integration tests if no real API key is available
const hasApiKey = process.env.FIRECRAWL_API_KEY && process.env.FIRECRAWL_API_KEY !== 'test-api-key';
const describeIntegration = hasApiKey ? describe : describe.skip;

describeIntegration('Company Research Integration Tests', () => {
  beforeAll(() => {
    if (!hasApiKey) {
      // Log skipping message only if needed for debugging
    }
  });

  it('should successfully research Buster company information', async () => {
    const result = await researchCompany('https://buster.so');

    // Verify basic structure
    expect(result).toBeDefined();
    expect(result.company).toBeTruthy();
    expect(result.industry).toBeTruthy();
    expect(result.businessModel).toBeTruthy();
    expect(result.services).toBeInstanceOf(Array);
    expect(result.services.length).toBeGreaterThan(0);
    expect(result.description).toBeTruthy();
    expect(result.keyInsights).toBeInstanceOf(Array);
    expect(result.keyInsights.length).toBeGreaterThan(0);
    expect(result.url).toBe('https://buster.so');
    expect(result.researchedAt).toBeInstanceOf(Date);
    expect(result.rawData).toBeDefined();

    // Verify content quality for Buster
    expect(result.company.toLowerCase()).toContain('buster');
    expect(result.description.length).toBeGreaterThan(100); // Should be substantial
    expect(result.industry.toLowerCase()).toMatch(/tech|software|data|analytics|business/);
  }, 120000); // 2 minutes timeout for real API calls

  it('should handle research with custom options', async () => {
    const result = await researchCompany('https://buster.so', {
      includeFinancials: true,
      includeNews: true,
      focusAreas: ['technology', 'business-model'],
      maxWaitTime: 120000, // 2 minutes
      pollingInterval: 3000, // 3 seconds
    });

    expect(result).toBeDefined();
    expect(result.company).toBeTruthy();
    expect(result.description).toBeTruthy();
  }, 150000); // 2.5 minutes timeout

  it('should handle invalid URLs gracefully', async () => {
    await expect(researchCompany('not-a-url')).rejects.toThrow(CompanyResearchError);
    await expect(
      researchCompany('https://this-domain-definitely-does-not-exist-12345.com')
    ).rejects.toThrow(CompanyResearchError);
  });

  it('should handle inaccessible URLs', async () => {
    // Using a valid URL format but likely inaccessible site
    await expect(researchCompany('https://httpstat.us/404')).rejects.toThrow(CompanyResearchError);
  }, 60000);
});

// Additional test for testing without API key (always runs)
describe('Company Research - No API Key', () => {
  it('should throw error when no API key is provided', async () => {
    // Temporarily remove API key
    const originalKey = process.env.FIRECRAWL_API_KEY;
    process.env.FIRECRAWL_API_KEY = undefined;

    try {
      await expect(researchCompany('https://buster.so')).rejects.toThrow(CompanyResearchError);
    } finally {
      // Restore API key
      if (originalKey) {
        process.env.FIRECRAWL_API_KEY = originalKey;
      }
    }
  });
});

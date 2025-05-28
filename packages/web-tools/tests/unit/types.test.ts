import { describe, expect, it } from 'vitest';
import { CompanyResearchError } from '../../src/deep-research/types.js';

describe('CompanyResearchError', () => {
  it('should create error with default code', () => {
    const error = new CompanyResearchError('Test error message');

    expect(error.message).toBe('Test error message');
    expect(error.code).toBe('API_ERROR');
    expect(error.name).toBe('CompanyResearchError');
    expect(error.details).toBeUndefined();
  });

  it('should create error with custom code and details', () => {
    const details = 'URL: https://example.com';
    const error = new CompanyResearchError('Timeout error', 'TIMEOUT', details);

    expect(error.message).toBe('Timeout error');
    expect(error.code).toBe('TIMEOUT');
    expect(error.details).toBe(details);
  });

  it('should be instanceof Error', () => {
    const error = new CompanyResearchError('Test');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CompanyResearchError);
  });
});

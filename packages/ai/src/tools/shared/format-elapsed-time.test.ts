import { describe, expect, it } from 'vitest';
import { formatElapsedTime } from './format-elapsed-time';

describe('formatElapsedTime', () => {
  it('should return undefined when startTime is not provided', () => {
    const result = formatElapsedTime();
    expect(result).toBeUndefined();
  });

  it('should format seconds with decimals by default', () => {
    const startTime = Date.now();
    const endTime = startTime + 4900; // 4.9 seconds

    const result = formatElapsedTime(startTime, endTime);
    expect(result).toBe('4.9 seconds');
  });

  it('should format seconds without decimals when includeDecimals is false', () => {
    const startTime = Date.now();
    const endTime = startTime + 4900; // 4.9 seconds (should floor to 4)

    const result = formatElapsedTime(startTime, endTime, { includeDecimals: false });
    expect(result).toBe('4 seconds');
  });

  it('should handle singular second correctly', () => {
    const startTime = Date.now();
    const endTime = startTime + 1000; // exactly 1 second

    const result = formatElapsedTime(startTime, endTime);
    expect(result).toBe('1.0 second');
  });

  it('should format minutes correctly for elapsed time over 60 seconds', () => {
    const startTime = Date.now();
    const endTime = startTime + 150000; // 2.5 minutes (150 seconds)

    const result = formatElapsedTime(startTime, endTime);
    expect(result).toBe('2 minutes');
  });

  it('should handle singular minute correctly', () => {
    const startTime = Date.now();
    const endTime = startTime + 90000; // 1.5 minutes (90 seconds)

    const result = formatElapsedTime(startTime, endTime);
    expect(result).toBe('1 minute');
  });

  it('should use current time as endTime when not provided', () => {
    const startTime = Date.now() - 3000; // 3 seconds ago

    const result = formatElapsedTime(startTime);
    // Should be approximately 3 seconds, allowing for small timing differences
    expect(result).toMatch(/^3\.\d second/);
  });
});

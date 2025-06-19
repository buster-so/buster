import { describe, expect, it } from 'vitest';
import { testFunction } from './test_function';

describe('users', () => {
  it('should be defined and true', async () => {
    // const users = await testFunction();
    // expect(users).toBeDefined();
    expect(true).toBe(true);
    expect(testFunction()).toBeDefined();
  });

  it('should be false', async () => {
    // const users = await testFunction();
    // expect(users).toBeDefined();
    expect(false).toBe(false);
  });
});

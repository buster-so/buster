import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';

// Mock Bun's Glob API for Node.js test environment
vi.mock('bun', () => ({
  Glob: class MockGlob {
    constructor(
      public pattern: string,
      public options: any
    ) {}
    async scan() {
      // Return empty for tests
      return [];
    }
  },
}));

import { Main } from './main';

describe('Main chat screen', () => {
  it('renders header and guidance text', () => {
    const { lastFrame } = render(<Main />);
    const output = lastFrame() ?? '';

    expect(output).toContain('BUSTER v0.3.2');
    expect(output).toContain('Your AI Data Worker.');
    expect(output).toContain('You are standing in an open terminal. An AI awaits your commands.');
    expect(output).toContain('ENTER send');
    expect(output).toContain('? for help');
  });
});

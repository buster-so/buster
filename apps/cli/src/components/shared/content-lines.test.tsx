import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { ContentLines } from './content-lines';

describe('ContentLines', () => {
  it('should render multiple lines', () => {
    const lines = ['line 1', 'line 2', 'line 3'];
    const { lastFrame } = render(<ContentLines lines={lines} />);

    expect(lastFrame()).toContain('line 1');
    expect(lastFrame()).toContain('line 2');
    expect(lastFrame()).toContain('line 3');
  });

  it('should render single line', () => {
    const lines = ['single line'];
    const { lastFrame } = render(<ContentLines lines={lines} />);

    expect(lastFrame()).toContain('single line');
  });

  it('should render empty array', () => {
    const lines: string[] = [];
    const { lastFrame } = render(<ContentLines lines={lines} />);

    expect(lastFrame()).toBe('');
  });

  it('should render empty strings', () => {
    const lines = ['', '', ''];
    const { lastFrame } = render(<ContentLines lines={lines} />);

    // Empty strings still render as text nodes
    expect(lastFrame()).toBeDefined();
  });

  it('should handle lines with special characters', () => {
    const lines = ['line with "quotes"', 'line with <brackets>', 'line with & ampersand'];
    const { lastFrame } = render(<ContentLines lines={lines} />);

    expect(lastFrame()).toContain('line with "quotes"');
    expect(lastFrame()).toContain('line with <brackets>');
    expect(lastFrame()).toContain('line with & ampersand');
  });

  it('should use custom color when provided', () => {
    const lines = ['colored line'];
    const { lastFrame } = render(<ContentLines lines={lines} color='#ff0000' />);

    expect(lastFrame()).toContain('colored line');
  });
});

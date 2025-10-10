import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { ExpansionHint } from './expansion-hint';

describe('ExpansionHint', () => {
  it('should render nothing when totalLines <= visibleLines', () => {
    const { lastFrame } = render(
      <ExpansionHint isExpanded={false} totalLines={5} visibleLines={5} />
    );

    expect(lastFrame()).toBe('');
  });

  it('should render nothing when totalLines < visibleLines', () => {
    const { lastFrame } = render(
      <ExpansionHint isExpanded={false} totalLines={3} visibleLines={5} />
    );

    expect(lastFrame()).toBe('');
  });

  it('should show collapse hint when expanded', () => {
    const { lastFrame } = render(
      <ExpansionHint isExpanded={true} totalLines={10} visibleLines={5} />
    );

    expect(lastFrame()).toContain('(Press Ctrl+O to collapse)');
  });

  it('should show expand hint with hidden line count when not expanded', () => {
    const { lastFrame } = render(
      <ExpansionHint isExpanded={false} totalLines={10} visibleLines={5} />
    );

    expect(lastFrame()).toContain('... +5 lines (Press Ctrl+O to expand)');
  });

  it('should calculate correct hidden line count', () => {
    const { lastFrame } = render(
      <ExpansionHint isExpanded={false} totalLines={20} visibleLines={5} />
    );

    expect(lastFrame()).toContain('... +15 lines (Press Ctrl+O to expand)');
  });

  it('should show singular "line" when only 1 hidden line', () => {
    const { lastFrame } = render(
      <ExpansionHint isExpanded={false} totalLines={6} visibleLines={5} />
    );

    expect(lastFrame()).toContain('... +1 lines (Press Ctrl+O to expand)');
  });
});

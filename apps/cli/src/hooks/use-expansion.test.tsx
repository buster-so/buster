import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { ExpansionContext, useExpansion } from './use-expansion';

describe('useExpansion', () => {
  function TestComponent() {
    const isExpanded = useExpansion();

    return <Text>{isExpanded ? 'expanded' : 'collapsed'}</Text>;
  }

  it('should use default context value when no provider is present', () => {
    const { lastFrame } = render(<TestComponent />);

    expect(lastFrame()).toContain('collapsed');
  });

  it('should use context value from provider when present', () => {
    const { lastFrame } = render(
      <ExpansionContext.Provider value={{ isExpanded: true }}>
        <TestComponent />
      </ExpansionContext.Provider>
    );

    expect(lastFrame()).toContain('expanded');
  });

  it('should react to context changes', () => {
    const { lastFrame, rerender } = render(
      <ExpansionContext.Provider value={{ isExpanded: false }}>
        <TestComponent />
      </ExpansionContext.Provider>
    );

    expect(lastFrame()).toContain('collapsed');

    // Rerender with new context value
    rerender(
      <ExpansionContext.Provider value={{ isExpanded: true }}>
        <TestComponent />
      </ExpansionContext.Provider>
    );

    expect(lastFrame()).toContain('expanded');
  });
});

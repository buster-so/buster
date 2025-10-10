import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { IndentedContent } from './indented-content';

describe('IndentedContent', () => {
  it('should render children', () => {
    const { lastFrame } = render(
      <IndentedContent>
        <Text>Content inside</Text>
      </IndentedContent>
    );

    expect(lastFrame()).toContain('Content inside');
  });

  it('should render multiple children', () => {
    const { lastFrame } = render(
      <IndentedContent>
        <Text>First child</Text>
        <Text>Second child</Text>
        <Text>Third child</Text>
      </IndentedContent>
    );

    expect(lastFrame()).toContain('First child');
    expect(lastFrame()).toContain('Second child');
    expect(lastFrame()).toContain('Third child');
  });

  it('should handle empty children', () => {
    const { lastFrame } = render(<IndentedContent>{null}</IndentedContent>);

    expect(lastFrame()).toBe('');
  });

  it('should handle text nodes directly', () => {
    const { lastFrame } = render(
      <IndentedContent>
        <Text>Direct text content</Text>
      </IndentedContent>
    );

    expect(lastFrame()).toContain('Direct text content');
  });
});

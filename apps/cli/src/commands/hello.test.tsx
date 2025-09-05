import { render } from 'ink-testing-library';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { HelloCommand } from './hello';

describe('HelloCommand', () => {
  it('should render greeting with default name', () => {
    const { lastFrame } = render(<HelloCommand name='World' />);

    expect(lastFrame()).toContain('Hello, World!');
    expect(lastFrame()).toContain('Buster CLI');
  });

  it('should render greeting in uppercase when flag is set', () => {
    const { lastFrame } = render(<HelloCommand name='Claude' uppercase={true} />);

    expect(lastFrame()).toContain('HELLO, CLAUDE!');
  });

  it('should render greeting in normal case when uppercase flag is false', () => {
    const { lastFrame } = render(<HelloCommand name='Claude' uppercase={false} />);

    expect(lastFrame()).toContain('Hello, Claude!');
    expect(lastFrame()).not.toContain('HELLO, CLAUDE!');
  });
});

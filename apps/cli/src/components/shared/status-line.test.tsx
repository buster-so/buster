import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { StatusLine } from './status-line';

describe('StatusLine', () => {
  it('should render message with arrow prefix', () => {
    const { lastFrame } = render(<StatusLine message='Task completed' />);

    expect(lastFrame()).toContain('↳ Task completed');
  });

  it('should default to info status when not specified', () => {
    const { lastFrame } = render(<StatusLine message='Info message' />);

    expect(lastFrame()).toContain('↳ Info message');
  });

  it('should render success status', () => {
    const { lastFrame } = render(<StatusLine message='Success message' status='success' />);

    expect(lastFrame()).toContain('↳ Success message');
  });

  it('should render error status', () => {
    const { lastFrame } = render(<StatusLine message='Error message' status='error' />);

    expect(lastFrame()).toContain('↳ Error message');
  });

  it('should render info status', () => {
    const { lastFrame } = render(<StatusLine message='Info message' status='info' />);

    expect(lastFrame()).toContain('↳ Info message');
  });

  it('should handle empty message', () => {
    const { lastFrame } = render(<StatusLine message='' />);

    expect(lastFrame()).toContain('↳');
  });

  it('should handle multi-line message', () => {
    const { lastFrame } = render(<StatusLine message='Line 1\nLine 2' status='success' />);

    expect(lastFrame()).toContain('↳ Line 1');
    expect(lastFrame()).toContain('Line 2');
  });
});

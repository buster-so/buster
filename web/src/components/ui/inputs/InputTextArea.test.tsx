import { render, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InputTextArea } from './InputTextArea';

// Mock useMemoizedFn hook
vi.mock('@/hooks', () => ({
  useMemoizedFn: (fn: any) => fn
}));

// Mock cn function
vi.mock('@/lib/classMerge', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('InputTextArea', () => {
  // Mock getComputedStyle
  const mockGetComputedStyle = vi.fn();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock window.getComputedStyle
    Object.defineProperty(window, 'getComputedStyle', {
      value: mockGetComputedStyle,
      writable: true
    });

    // Mock requestAnimationFrame
    Object.defineProperty(window, 'requestAnimationFrame', {
      value: (callback: FrameRequestCallback) => {
        setTimeout(callback, 0);
        return 1;
      },
      writable: true
    });

    // Default mock values for getComputedStyle
    mockGetComputedStyle.mockReturnValue({
      lineHeight: '20px',
      fontSize: '16px',
      paddingTop: '8px',
      paddingBottom: '8px'
    });
  });

  describe('calculateMinHeight functionality', () => {
    it('should calculate correct min height with default rows', async () => {
      const { container } = render(
        <InputTextArea autoResize={{ minRows: 2 }} data-testid="textarea" />
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      await waitFor(() => {
        // With lineHeight: 20px, paddingTop: 8px, paddingBottom: 8px
        // minHeight = 2 rows * 20px + 8px + 8px = 56px
        expect(textarea.style.minHeight).toBe('56px');
      });
    });

    it('should calculate correct min height with custom minRows', async () => {
      const { container } = render(
        <InputTextArea autoResize={{ minRows: 3 }} data-testid="textarea" />
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      await waitFor(() => {
        // With lineHeight: 20px, paddingTop: 8px, paddingBottom: 8px
        // minHeight = 3 rows * 20px + 8px + 8px = 76px
        expect(textarea.style.minHeight).toBe('76px');
      });
    });

    it('should use fontSize * 1.2 when lineHeight is not available', async () => {
      mockGetComputedStyle.mockReturnValue({
        lineHeight: 'normal',
        fontSize: '16px',
        paddingTop: '8px',
        paddingBottom: '8px'
      });

      const { container } = render(
        <InputTextArea autoResize={{ minRows: 2 }} data-testid="textarea" />
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      await waitFor(() => {
        // With fontSize: 16px * 1.2 = 19.2px, paddingTop: 8px, paddingBottom: 8px
        // minHeight = 2 rows * 19.2px + 8px + 8px = 54.4px
        expect(textarea.style.minHeight).toBe('54.4px');
      });
    });
  });

  describe('adjustHeight functionality', () => {
    it('should set height to minHeight when textarea is empty', async () => {
      const { container } = render(
        <InputTextArea autoResize={{ minRows: 2 }} data-testid="textarea" />
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      // Mock scrollHeight property
      Object.defineProperty(textarea, 'scrollHeight', {
        get: () => 100, // Large scrollHeight that should be ignored for empty content
        configurable: true
      });

      // Set empty value and trigger input event
      textarea.value = '';
      fireEvent.input(textarea, { target: { value: '' } });

      await waitFor(() => {
        expect(textarea.style.height).toBe('56px'); // minHeight for 2 rows
      });
    });

    it('should set height to minHeight when content is minimal', async () => {
      const { container } = render(
        <InputTextArea autoResize={{ minRows: 2 }} data-testid="textarea" />
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      // Mock scrollHeight property
      Object.defineProperty(textarea, 'scrollHeight', {
        get: () => 60, // Close to minHeight
        configurable: true
      });

      textarea.value = 'short text';
      fireEvent.input(textarea, { target: { value: 'short text' } });

      await waitFor(() => {
        expect(textarea.style.height).toBe('56px'); // minHeight for 2 rows
      });
    });

    it('should use scrollHeight when content requires more space', async () => {
      const { container } = render(
        <InputTextArea autoResize={{ minRows: 2 }} data-testid="textarea" />
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      const longText =
        'This is a very long text that spans multiple lines and should require more space than the minimum height';

      // Mock scrollHeight property
      Object.defineProperty(textarea, 'scrollHeight', {
        get: () => 120,
        configurable: true
      });

      textarea.value = longText;
      fireEvent.input(textarea, { target: { value: longText } });

      await waitFor(() => {
        expect(textarea.style.height).toBe('120px');
      });
    });

    it('should respect maxRows and set overflow when content exceeds max height', async () => {
      const { container } = render(
        <InputTextArea autoResize={{ minRows: 2, maxRows: 4 }} data-testid="textarea" />
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      const veryLongText = 'Very long text that exceeds maximum rows\n'.repeat(10);

      // Mock scrollHeight property
      Object.defineProperty(textarea, 'scrollHeight', {
        get: () => 200,
        configurable: true
      });

      textarea.value = veryLongText;
      fireEvent.input(textarea, { target: { value: veryLongText } });

      await waitFor(() => {
        // maxHeight = 4 rows * 20px + 8px + 8px = 96px
        expect(textarea.style.height).toBe('96px');
        expect(textarea.style.overflowY).toBe('auto');
      });
    });

    it('should set overflow to hidden when content does not exceed max height', async () => {
      const { container } = render(
        <InputTextArea autoResize={{ minRows: 2, maxRows: 4 }} data-testid="textarea" />
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      // Mock scrollHeight property
      Object.defineProperty(textarea, 'scrollHeight', {
        get: () => 80,
        configurable: true
      });

      textarea.value = 'Normal text';
      fireEvent.input(textarea, { target: { value: 'Normal text' } });

      await waitFor(() => {
        expect(textarea.style.height).toBe('80px');
        expect(textarea.style.overflowY).toBe('hidden');
      });
    });

    it('should handle multiline content correctly', async () => {
      const { container } = render(
        <InputTextArea autoResize={{ minRows: 2 }} data-testid="textarea" />
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      const multilineText = 'Line 1\nLine 2\nLine 3';

      // Mock scrollHeight property
      Object.defineProperty(textarea, 'scrollHeight', {
        get: () => 76,
        configurable: true
      });

      textarea.value = multilineText;
      fireEvent.input(textarea, { target: { value: multilineText } });

      await waitFor(() => {
        expect(textarea.style.height).toBe('76px');
      });
    });
  });

  describe('autoResize integration', () => {
    it('should not apply auto-resize when autoResize is not provided', () => {
      const { container } = render(<InputTextArea data-testid="textarea" />);
      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      expect(textarea.style.minHeight).toBe('');
      expect(textarea.classList.contains('resize-none!')).toBe(false);
    });

    it('should apply resize-none class when autoResize is enabled', () => {
      const { container } = render(
        <InputTextArea autoResize={{ minRows: 2 }} data-testid="textarea" />
      );
      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      expect(textarea.classList.toString()).toContain('resize-none!');
    });

    it('should adjust height when value prop changes', async () => {
      const { container, rerender } = render(
        <InputTextArea autoResize={{ minRows: 2 }} value="" data-testid="textarea" />
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      await waitFor(() => {
        expect(textarea.style.height).toBe('56px'); // minHeight
      });

      // Change value prop
      rerender(
        <InputTextArea
          autoResize={{ minRows: 2 }}
          value="New longer content that requires more space"
          data-testid="textarea"
        />
      );

      await waitFor(() => {
        // Height should be recalculated
        expect(textarea.style.height).toBeTruthy();
      });
    });
  });

  describe('keyboard events', () => {
    it('should call onPressEnter when Enter is pressed without modifiers', () => {
      const onPressEnter = vi.fn();
      const { container } = render(
        <InputTextArea onPressEnter={onPressEnter} data-testid="textarea" />
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      fireEvent.keyDown(textarea, { key: 'Enter' });

      expect(onPressEnter).toHaveBeenCalledTimes(1);
    });

    it('should call onPressMetaEnter when Enter is pressed with meta key', () => {
      const onPressMetaEnter = vi.fn();
      const { container } = render(
        <InputTextArea onPressMetaEnter={onPressMetaEnter} data-testid="textarea" />
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });

      expect(onPressMetaEnter).toHaveBeenCalledTimes(1);
    });

    it('should not prevent default when Enter is pressed with shift key', () => {
      const onPressEnter = vi.fn();
      const { container } = render(
        <InputTextArea onPressEnter={onPressEnter} data-testid="textarea" />
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      fireEvent.keyDown(textarea, event);

      expect(onPressEnter).not.toHaveBeenCalled();
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle window resize events', async () => {
      const { container } = render(
        <InputTextArea autoResize={{ minRows: 2 }} data-testid="textarea" />
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      // Trigger window resize
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(textarea.style.height).toBeTruthy();
      });
    });

    it('should handle padding values correctly', async () => {
      mockGetComputedStyle.mockReturnValue({
        lineHeight: '20px',
        fontSize: '16px',
        paddingTop: '12px',
        paddingBottom: '15px'
      });

      const { container } = render(
        <InputTextArea autoResize={{ minRows: 1 }} data-testid="textarea" />
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      await waitFor(() => {
        // minHeight = 1 row * 20px + 12px + 15px = 47px
        expect(textarea.style.minHeight).toBe('47px');
      });
    });
  });
});

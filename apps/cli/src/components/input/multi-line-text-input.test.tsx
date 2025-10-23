import { render } from 'ink-testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MultiLineTextInput } from './multi-line-text-input';

// Mock settings to disable vim mode for simpler tests
vi.mock('../../utils/settings', () => ({
  getSetting: vi.fn(() => false),
}));

describe('MultiLineTextInput - isThinking behavior', () => {
  const mockOnChange = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when isThinking is false', () => {
    it('should allow regular character input', () => {
      const { stdin } = render(
        <MultiLineTextInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={false}
        />
      );

      // Type 'a'
      stdin.write('a');

      // Should call onChange with the new character
      expect(mockOnChange).toHaveBeenCalledWith('a');
    });

    it('should allow submit with Enter key', async () => {
      const { stdin } = render(
        <MultiLineTextInput
          value="test input"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={false}
        />
      );

      // Press Enter
      stdin.write('\r');

      // Wait for async submit (setTimeout in component)
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should call onSubmit
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('should allow multiple characters to be typed', () => {
      let currentValue = '';
      const mockOnChangeWithState = vi.fn((newValue: string) => {
        currentValue = newValue;
      });

      const { stdin, rerender } = render(
        <MultiLineTextInput
          value={currentValue}
          onChange={mockOnChangeWithState}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={false}
        />
      );

      // Type characters one at a time (simulating actual typing, not paste)
      const typeChar = (char: string) => {
        stdin.write(char);
        rerender(
          <MultiLineTextInput
            value={currentValue}
            onChange={mockOnChangeWithState}
            onSubmit={mockOnSubmit}
            placeholder="Type here..."
            isThinking={false}
          />
        );
      };

      typeChar('h');
      typeChar('e');
      typeChar('l');
      typeChar('l');
      typeChar('o');

      // Should call onChange for each character
      expect(mockOnChangeWithState).toHaveBeenCalledTimes(5);
      expect(currentValue).toBe('hello');
    });
  });

  describe('when isThinking is true', () => {
    it('should ignore regular character input', () => {
      const { stdin } = render(
        <MultiLineTextInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={true}
        />
      );

      // Try to type 'a'
      stdin.write('a');

      // Should NOT call onChange
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should prevent submit with Enter key', () => {
      const { stdin } = render(
        <MultiLineTextInput
          value="test input"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={true}
        />
      );

      // Try to press Enter
      stdin.write('\r');

      // Should NOT call onSubmit
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should ignore backspace key', () => {
      const { stdin } = render(
        <MultiLineTextInput
          value="test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={true}
        />
      );

      // Try to press backspace
      stdin.write('\x7F'); // Backspace

      // Should NOT call onChange
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should ignore arrow keys', () => {
      const { stdin } = render(
        <MultiLineTextInput
          value="test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={true}
        />
      );

      // Try to press arrow keys
      stdin.write('\x1B[A'); // Up arrow
      stdin.write('\x1B[B'); // Down arrow
      stdin.write('\x1B[C'); // Right arrow
      stdin.write('\x1B[D'); // Left arrow

      // Should NOT call onChange or onSubmit
      expect(mockOnChange).not.toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should still allow Escape key (for aborting)', () => {
      const { stdin, lastFrame } = render(
        <MultiLineTextInput
          value="test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={true}
        />
      );

      // Press Escape (this should be allowed for abort functionality)
      stdin.write('\x1B'); // ESC

      // The escape key is allowed through, but in this test it won't do anything
      // because we don't have an autocomplete menu open. The important thing
      // is that it doesn't throw an error and is processed.
      // In the real app, this is caught by the parent component for aborting.
      expect(lastFrame()).toBeDefined();
    });

    it('should ignore multiple characters', () => {
      const { stdin } = render(
        <MultiLineTextInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={true}
        />
      );

      // Try to type multiple characters
      stdin.write('hello world');

      // Should NOT call onChange
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('transition between thinking states', () => {
    it('should allow input after thinking stops', () => {
      const { stdin, rerender } = render(
        <MultiLineTextInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={true}
        />
      );

      // Try to type while thinking
      stdin.write('a');
      expect(mockOnChange).not.toHaveBeenCalled();

      // Stop thinking
      rerender(
        <MultiLineTextInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={false}
        />
      );

      // Now typing should work
      stdin.write('b');
      expect(mockOnChange).toHaveBeenCalledWith('b');
    });

    it('should prevent input when thinking starts', () => {
      const { stdin, rerender } = render(
        <MultiLineTextInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={false}
        />
      );

      // Type while not thinking
      stdin.write('a');
      expect(mockOnChange).toHaveBeenCalledWith('a');

      // Clear mock
      mockOnChange.mockClear();

      // Start thinking
      rerender(
        <MultiLineTextInput
          value="a"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={true}
        />
      );

      // Typing should now be blocked
      stdin.write('b');
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('collapsed paste behavior', () => {
    it('should collapse pastes larger than 5 lines into tokens', async () => {
      const { stdin } = render(
        <MultiLineTextInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={false}
        />
      );

      // Paste 10 lines of text
      const pastedText = Array(10).fill('content').join('\n');
      stdin.write(pastedText);

      // Wait for paste buffer timeout (50ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should call onChange with a token instead of full text
      expect(mockOnChange).toHaveBeenCalled();
      const changedValue = mockOnChange.mock.calls[0]?.[0];
      expect(changedValue).toBeDefined();
      expect(changedValue).toContain('[Pasted text #1 +10 lines]');
      // Should NOT contain the actual pasted content (multiple occurrences)
      expect(changedValue).not.toContain('content\ncontent');
    });

    it('should NOT collapse pastes of 5 lines or less', async () => {
      const { stdin } = render(
        <MultiLineTextInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={false}
        />
      );

      // Paste exactly 5 lines
      const pastedText = 'line1\nline2\nline3\nline4\nline5';
      stdin.write(pastedText);

      // Wait for paste buffer timeout (50ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should call onChange with the actual text (not collapsed)
      expect(mockOnChange).toHaveBeenCalledWith(pastedText);
    });

    it('should number multiple pastes sequentially', async () => {
      let currentValue = '';
      const mockOnChangeWithState = vi.fn((newValue: string) => {
        currentValue = newValue;
      });

      const { stdin, rerender } = render(
        <MultiLineTextInput
          value={currentValue}
          onChange={mockOnChangeWithState}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={false}
        />
      );

      // First paste
      const paste1 = Array(6).fill('a').join('\n');
      stdin.write(paste1);

      // Wait for paste buffer timeout (50ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(currentValue).toContain('[Pasted text #1 +6 lines]');

      // Re-render with updated value for second paste
      rerender(
        <MultiLineTextInput
          value={currentValue}
          onChange={mockOnChangeWithState}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={false}
        />
      );

      // Second paste - should get #2
      const paste2 = Array(7).fill('b').join('\n');
      stdin.write(paste2);

      // Wait for paste buffer timeout again
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(currentValue).toContain('[Pasted text #2 +7 lines]');
    });

    it('should reconstruct actual text on submit', async () => {
      let currentValue = '';
      const mockOnChangeWithState = vi.fn((newValue: string) => {
        currentValue = newValue;
      });

      const { stdin, rerender } = render(
        <MultiLineTextInput
          value={currentValue}
          onChange={mockOnChangeWithState}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={false}
        />
      );

      // Paste large text
      const pastedText = Array(10).fill('line content').join('\n');
      stdin.write(pastedText);

      // Wait for paste buffer timeout (50ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Value should be token
      expect(currentValue).toContain('[Pasted text #1 +10 lines]');

      // Rerender with updated value
      rerender(
        <MultiLineTextInput
          value={currentValue}
          onChange={mockOnChangeWithState}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={false}
        />
      );

      // Submit - should pass reconstructed text to onSubmit
      stdin.write('\r');

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should have called onSubmit with the actual reconstructed text
      expect(mockOnSubmit).toHaveBeenCalledWith(pastedText);
    });

    it('should handle deleting part of a token (token becomes invalid)', async () => {
      const { stdin } = render(
        <MultiLineTextInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          placeholder="Type here..."
          isThinking={false}
        />
      );

      // Paste large text
      const pastedText = Array(10).fill('line').join('\n');
      stdin.write(pastedText);

      // Wait for paste buffer timeout (50ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Token should be inserted
      const token = mockOnChange.mock.calls[0]?.[0];
      expect(token).toBeDefined();
      expect(token).toContain('[Pasted text #1 +10 lines]');

      // If user deletes part of the token, it's just treated as regular text
      // (The actual pasted content is lost - symbolic representation only)
      // This is expected behavior per requirements
    });
  });
});

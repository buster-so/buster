import { Box, Text, useInput } from 'ink';
import { useEffect, useRef, useState } from 'react';
import { detectPaste, insertTextAtCursor } from '../../utils/paste-handler';
import {
  createPasteToken,
  reconstructActualText,
  shouldCollapsePaste,
  type TokenMap,
} from '../../utils/paste-token';
import { getSetting } from '../../utils/settings';
import type { VimMode, VimState } from '../../utils/vim-mode';
import { handleVimKeybinding } from '../../utils/vim-mode';

interface MultiLineTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (finalValue?: string) => void;
  onMentionChange?: (mention: string | null, cursorPosition: number) => void;
  onSlashChange?: (query: string | null, cursorPosition: number) => void;
  onAutocompleteNavigate?: (direction: 'up' | 'down' | 'select' | 'close') => void;
  placeholder?: string;
  focus?: boolean;
  isAutocompleteOpen?: boolean;
  onVimModeChange?: (mode: VimMode) => void;
  isThinking?: boolean;
}

export function MultiLineTextInput({
  value,
  onChange,
  onSubmit,
  onMentionChange,
  onSlashChange,
  onAutocompleteNavigate,
  placeholder = '',
  focus = true,
  isAutocompleteOpen = false,
  onVimModeChange,
  isThinking = false,
}: MultiLineTextInputProps) {
  const [cursorPosition, setCursorPosition] = useState(value.length);
  const [expectingNewline, setExpectingNewline] = useState(false);
  // Always show cursor - no blinking to prevent re-renders
  const showCursor = true;

  // Collapsed paste state
  // tokenMap: stores mapping of tokens (e.g., "[Pasted text #1 +10 lines]") to actual text
  // nextTokenNumber: counter for numbering paste tokens (#1, #2, #3, etc.)
  const [tokenMap, setTokenMap] = useState<TokenMap>({});
  const [nextTokenNumber, setNextTokenNumber] = useState(1);

  // Paste buffering state for consolidating chunked pastes
  // Terminal may split large pastes into multiple chunks. We buffer them
  // and process as a single paste after a timeout.
  const pasteBufferRef = useRef<string[]>([]);
  const pasteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pasteCursorPositionRef = useRef<number>(0);

  // Vim mode state
  const [vimEnabled] = useState(() => getSetting('vimMode'));
  const [vimState, setVimState] = useState<VimState>({
    mode: 'insert', // Start in insert mode for better UX
  });
  const lastVimCommand = useRef<string>('');

  // Notify parent of vim mode changes
  useEffect(() => {
    if (vimEnabled && onVimModeChange) {
      onVimModeChange(vimState.mode);
    }
  }, [vimState.mode, vimEnabled, onVimModeChange]);

  // Cleanup paste timer on unmount
  useEffect(() => {
    return () => {
      if (pasteTimerRef.current) {
        clearTimeout(pasteTimerRef.current);
      }
    };
  }, []);

  // Update cursor position when value changes externally (e.g., when cleared after submit)
  // Also reset token state when input is cleared
  useEffect(() => {
    setCursorPosition(value.length);

    // If value is cleared (after submit), reset token tracking and paste buffer
    if (value === '') {
      setTokenMap({});
      setNextTokenNumber(1);

      // Clear any pending paste timer and buffer
      if (pasteTimerRef.current) {
        clearTimeout(pasteTimerRef.current);
        pasteTimerRef.current = null;
      }
      pasteBufferRef.current = [];
    }
  }, [value]);

  // Function to process buffered paste chunks as a single paste
  const processBufferedPaste = () => {
    const fullPastedText = pasteBufferRef.current.join('');
    const cursorPos = pasteCursorPositionRef.current;

    // Clear buffer and timer
    pasteBufferRef.current = [];
    pasteTimerRef.current = null;

    if (!fullPastedText) return;

    // Check if we should collapse this paste (> 5 lines)
    if (shouldCollapsePaste(fullPastedText)) {
      // Create a token for the large paste
      const pasteTokenResult = createPasteToken({
        text: fullPastedText,
        tokenNumber: nextTokenNumber,
      });

      // Insert the token in the display value
      const result = insertTextAtCursor({
        currentValue: value,
        cursorPosition: cursorPos,
        textToInsert: pasteTokenResult.token,
      });

      // Update token map to track this token's actual content
      setTokenMap((prev) => ({
        ...prev,
        [pasteTokenResult.token]: pasteTokenResult.actualText,
      }));

      // Increment token counter for next paste
      setNextTokenNumber((prev) => prev + 1);

      // Update parent with display value (with token)
      onChange(result.newValue);
      setCursorPosition(result.newCursorPosition);
      return;
    }

    // Small paste (≤ 5 lines): Insert normally without collapsing
    const result = insertTextAtCursor({
      currentValue: value,
      cursorPosition: cursorPos,
      textToInsert: fullPastedText,
    });
    onChange(result.newValue);
    setCursorPosition(result.newCursorPosition);
  };

  // Detect slash commands with debounce
  useEffect(() => {
    if (!onSlashChange) return;

    const timeoutId = setTimeout(() => {
      // Check if we're at the beginning or after a newline
      let slashStart = -1;

      // Look for a slash at the start of the current line
      const lines = value.substring(0, cursorPosition).split('\n');
      const currentLine = lines[lines.length - 1];
      if (!currentLine) return;

      const currentLineStart = cursorPosition - currentLine.length;

      if (currentLine.startsWith('/')) {
        slashStart = currentLineStart;
        const slashEnd = cursorPosition;
        const slashQuery = value.substring(slashStart + 1, slashEnd);

        // Only trigger if we're still in the command (no spaces)
        if (!slashQuery.includes(' ') && !slashQuery.includes('\n')) {
          onSlashChange(slashQuery, slashStart);
          return;
        }
      }

      // No active slash command
      onSlashChange(null, -1);
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [value, cursorPosition, onSlashChange]);

  // Detect @ mentions with debounce
  useEffect(() => {
    if (!onMentionChange) return;

    const timeoutId = setTimeout(() => {
      // Find the last @ before cursor position
      let mentionStart = -1;
      for (let i = cursorPosition - 1; i >= 0; i--) {
        if (value[i] === '@') {
          mentionStart = i;
          break;
        }
        // Stop if we hit whitespace or newline (mention ended)
        if (value[i] === ' ' || value[i] === '\n' || value[i] === '\t') {
          break;
        }
      }

      if (mentionStart !== -1) {
        // Check if there's a space or newline before @ (or it's at the start)
        const charBefore = mentionStart > 0 ? value[mentionStart - 1] : ' ';
        if (
          charBefore === ' ' ||
          charBefore === '\n' ||
          charBefore === '\t' ||
          mentionStart === 0
        ) {
          // Extract the mention query (text after @)
          const mentionEnd = cursorPosition;
          const mentionQuery = value.substring(mentionStart + 1, mentionEnd);

          // Only trigger if we're still in the mention (no spaces)
          if (!mentionQuery.includes(' ') && !mentionQuery.includes('\n')) {
            onMentionChange(mentionQuery, mentionStart);
            return;
          }
        }
      }

      // No active mention
      onMentionChange(null, -1);
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [value, cursorPosition, onMentionChange]);

  useInput(
    (input, key) => {
      if (!focus) return;

      // Disable all input when thinking (except Escape to abort)
      if (isThinking && !key.escape) {
        return;
      }

      // Debug: Log what we're receiving
      // console.log('Input received:', input, 'Key:', key);

      // PASTE DETECTION: Fast-path for pasted content
      // Detect paste early to bypass expensive checks (vim, autocomplete triggers, etc.)
      const hasSpecialKeys = Boolean(key.ctrl || key.meta || key.shift);
      const isPaste = detectPaste({ input, hasSpecialKeys });

      if (isPaste) {
        // Buffer this chunk - large pastes may come in multiple chunks from the terminal
        // Save cursor position from the first chunk
        if (pasteBufferRef.current.length === 0) {
          pasteCursorPositionRef.current = cursorPosition;
        }

        // Add chunk to buffer
        pasteBufferRef.current.push(input);

        // Clear any existing timer
        if (pasteTimerRef.current) {
          clearTimeout(pasteTimerRef.current);
        }

        // Start new timer - if no more chunks arrive in 50ms, process the buffered paste
        pasteTimerRef.current = setTimeout(() => {
          processBufferedPaste();
        }, 50);

        return;
      }

      // Handle vim mode if enabled (but skip escape when thinking - abort takes priority)
      if (vimEnabled && !(key.escape && isThinking)) {
        const action = handleVimKeybinding(
          input,
          key,
          { ...vimState, lastCommand: lastVimCommand.current },
          value,
          cursorPosition
        );

        // Update last command for compound commands (dd, yy, gg)
        if (vimState.mode === 'normal' && input && !key.escape) {
          if (
            input === lastVimCommand.current &&
            (input === 'd' || input === 'y' || input === 'g')
          ) {
            lastVimCommand.current = '';
          } else {
            lastVimCommand.current = input;
          }
        }

        // Handle vim actions
        if (action.preventDefault) {
          // Apply the action
          if (action.type === 'mode-change' && action.mode) {
            // biome-ignore lint/style/noNonNullAssertion: Dallin can confirm if this is safe
            setVimState((prev) => ({ ...prev, mode: action.mode! }));
            if (action.mode === 'visual') {
              setVimState((prev) => ({ ...prev, visualStart: cursorPosition }));
            }
          }
          if (action.cursorPosition !== undefined) {
            setCursorPosition(action.cursorPosition);
          }
          if (action.text !== undefined) {
            onChange(action.text);
          }
          if (action.yankedText !== undefined) {
            // biome-ignore lint/style/noNonNullAssertion: Dallin can confirm if this is safe
            setVimState((prev) => ({ ...prev, yankedText: action.yankedText! }));
          }
          if (action.mode !== undefined) {
            // biome-ignore lint/style/noNonNullAssertion: Dallin can confirm if this is safe
            setVimState((prev) => ({ ...prev, mode: action.mode! }));
          }
          return;
        }

        // In insert mode, handle submit with Enter (when not in autocomplete)
        if (vimState.mode === 'insert' && key.return && !isAutocompleteOpen) {
          // Before submitting, reconstruct actual text from display text with tokens
          const actualText = reconstructActualText({
            displayText: value,
            tokenMap,
          });

          // Pass the reconstructed text directly to onSubmit
          onSubmit(actualText);
          return;
        }

        // In normal/visual mode, block regular input
        if (vimState.mode !== 'insert') {
          return;
        }
      }

      // Handle autocomplete navigation when it's open
      if (isAutocompleteOpen && onAutocompleteNavigate) {
        if (key.upArrow) {
          onAutocompleteNavigate('up');
          return;
        }
        if (key.downArrow) {
          onAutocompleteNavigate('down');
          return;
        }
        if (key.escape) {
          onAutocompleteNavigate('close');
          return;
        }
        if (key.return || key.tab) {
          onAutocompleteNavigate('select');
          return;
        }
      }

      // Handle backslash + n sequence for newline
      if (expectingNewline) {
        setExpectingNewline(false);
        if (input === 'n') {
          // Insert newline
          const newValue = `${value.slice(0, cursorPosition)}\n${value.slice(cursorPosition)}`;
          onChange(newValue);
          setCursorPosition(cursorPosition + 1);
          return;
        } else {
          // Not 'n', so insert the backslash we skipped and this character
          let insertText = '\\';
          if (input && !key.return && !key.escape) {
            insertText += input;
          }
          const newValue = `${value.slice(0, cursorPosition)}${insertText}${value.slice(cursorPosition)}`;
          onChange(newValue);
          setCursorPosition(cursorPosition + insertText.length);

          // If it was Enter after backslash, submit
          if (key.return) {
            onSubmit();
          }
          return;
        }
      }

      // Check for backslash to start newline sequence
      if (input === '\\') {
        setExpectingNewline(true);
        return;
      }

      // Check for Shift+Enter (some terminals send this as ESC + Enter or specific sequences)
      // In many terminals, Shift+Enter might come through as:
      // 1. Just Enter with shift flag (but ink doesn't detect this properly)
      // 2. ESC followed by Enter
      // 3. A specific escape sequence

      // ESC key handling removed - doesn't work reliably for multi-key sequences

      // Check if Control key is pressed with Enter
      if (key.return && key.ctrl) {
        // Ctrl + Enter adds a newline
        const newValue = `${value.slice(0, cursorPosition)}\n${value.slice(cursorPosition)}`;
        onChange(newValue);
        setCursorPosition(cursorPosition + 1);
        return;
      }

      // Check if Meta/Alt key is pressed with Enter
      if (key.return && key.meta) {
        // Alt/Option + Enter adds a newline
        const newValue = `${value.slice(0, cursorPosition)}\n${value.slice(cursorPosition)}`;
        onChange(newValue);
        setCursorPosition(cursorPosition + 1);
        return;
      }

      // Some terminals might send Shift+Enter as just Enter with shift=true
      // But as we saw, ink only sets shift=true for uppercase letters
      // Let's try another approach: check for a special sequence
      if (key.return && key.shift) {
        // This likely won't work but let's keep it for terminals that support it
        const newValue = `${value.slice(0, cursorPosition)}\n${value.slice(cursorPosition)}`;
        onChange(newValue);
        setCursorPosition(cursorPosition + 1);
        return;
      }

      // Handle Enter - submit (only if not modified and autocomplete is not open)
      // This is now handled above in autocomplete navigation section
      if (key.return && !key.meta && !key.shift && !key.ctrl && !isAutocompleteOpen) {
        // Before submitting, reconstruct actual text from display text with tokens
        const actualText = reconstructActualText({
          displayText: value,
          tokenMap,
        });

        // Pass the reconstructed text directly to onSubmit
        onSubmit(actualText);
        return;
      }

      if (key.backspace || key.delete) {
        if (cursorPosition > 0) {
          const newValue = `${value.slice(0, cursorPosition - 1)}${value.slice(cursorPosition)}`;
          onChange(newValue);
          setCursorPosition(cursorPosition - 1);
        }
        return;
      }

      if (key.leftArrow) {
        setCursorPosition(Math.max(0, cursorPosition - 1));
        return;
      }

      if (key.rightArrow) {
        setCursorPosition(Math.min(value.length, cursorPosition + 1));
        return;
      }

      if (key.upArrow && !isAutocompleteOpen) {
        // Move cursor to previous line (only when autocomplete is closed)
        const lines = value.split('\n');
        let currentLineStart = 0;
        let currentLineIndex = 0;
        let positionInLine = cursorPosition;

        for (let i = 0; i < lines.length; i++) {
          // biome-ignore lint/style/noNonNullAssertion: Dallin can confirm if this is safe
          const lineLength = lines[i]!.length + (i < lines.length - 1 ? 1 : 0); // +1 for newline except last line
          // biome-ignore lint/style/noNonNullAssertion: Dallin can confirm if this is safe
          if (cursorPosition <= currentLineStart + lines[i]!.length) {
            currentLineIndex = i;
            positionInLine = cursorPosition - currentLineStart;
            break;
          }
          currentLineStart += lineLength;
        }

        if (currentLineIndex > 0) {
          const previousLineStart = lines
            .slice(0, currentLineIndex - 1)
            .reduce((acc, line) => acc + line.length + 1, 0);
          // biome-ignore lint/style/noNonNullAssertion: Dallin can confirm if this is safe
          const previousLineLength = lines[currentLineIndex - 1]!.length;
          const newPosition = previousLineStart + Math.min(positionInLine, previousLineLength);
          setCursorPosition(newPosition);
        }
        return;
      }

      if (key.downArrow && !isAutocompleteOpen) {
        // Move cursor to next line (only when autocomplete is closed)
        const lines = value.split('\n');
        let currentLineStart = 0;
        let currentLineIndex = 0;
        let positionInLine = cursorPosition;

        for (let i = 0; i < lines.length; i++) {
          // biome-ignore lint/style/noNonNullAssertion: Dallin can confirm if this is safe
          const lineLength = lines[i]!.length + (i < lines.length - 1 ? 1 : 0); // +1 for newline except last line
          // biome-ignore lint/style/noNonNullAssertion: Dallin can confirm if this is safe
          if (cursorPosition <= currentLineStart + lines[i]!.length) {
            currentLineIndex = i;
            positionInLine = cursorPosition - currentLineStart;
            break;
          }
          currentLineStart += lineLength;
        }

        if (currentLineIndex < lines.length - 1) {
          const nextLineStart = lines
            .slice(0, currentLineIndex + 1)
            .reduce((acc, line) => acc + line.length + 1, 0);
          const nextLineLength = lines[currentLineIndex + 1]?.length ?? 0;
          const newPosition = nextLineStart + Math.min(positionInLine, nextLineLength);
          setCursorPosition(newPosition);
        }
        return;
      }

      // Regular character input
      if (input && !key.ctrl && !key.meta) {
        const newValue = `${value.slice(0, cursorPosition)}${input}${value.slice(cursorPosition)}`;
        onChange(newValue);
        setCursorPosition(cursorPosition + input.length);
      }
    },
    { isActive: focus }
  );

  // Render the text with cursor
  const renderTextWithCursor = () => {
    // Show placeholder when empty
    if (!value) {
      if (expectingNewline) {
        // Show that we're expecting 'n' for newline
        return (
          <Box>
            <Text>\ </Text>
            <Text color="yellow">(press 'n' for newline)</Text>
          </Box>
        );
      }

      // Show placeholder with cursor in fixed position
      if (!focus) {
        return <Text dimColor>{placeholder}</Text>;
      }

      // Always reserve space for cursor to prevent shifting
      let cursorChar = '█';
      if (vimEnabled) {
        // Use block cursor for all vim modes
        cursorChar = '█';
      }

      return (
        <Box>
          <Text>{showCursor ? cursorChar : ' '}</Text>
          <Text dimColor>{placeholder}</Text>
        </Box>
      );
    }

    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);
    // Always use block cursor
    let cursorChar = showCursor && focus ? '█' : ' ';

    // Keep block cursor for all vim modes
    if (vimEnabled && focus && showCursor) {
      cursorChar = '█';
    }

    // Show special cursor when expecting newline
    if (expectingNewline) {
      cursorChar = '\\';
    }

    // If we're at the end of the text, just append cursor
    if (cursorPosition === value.length) {
      const textWithCursor = `${beforeCursor}${cursorChar}`;
      const lines = textWithCursor.split('\n');

      if (lines.length === 1) {
        return (
          <Box>
            <Text>{lines[0]}</Text>
            {expectingNewline && <Text color="yellow"> (press 'n' for newline)</Text>}
          </Box>
        );
      }

      return (
        <Box flexDirection="column">
          {lines.map((line, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Lines position stable during editing
            <Box key={index}>
              <Text>{line || ' '}</Text>
              {index === lines.length - 1 && expectingNewline && (
                <Text color="yellow"> (press 'n' for newline)</Text>
              )}
            </Box>
          ))}
        </Box>
      );
    }

    // Cursor is in the middle of text
    const restAfterCursor = afterCursor.slice(1);
    const textWithCursor = `${beforeCursor}${cursorChar}${restAfterCursor}`;
    const lines = textWithCursor.split('\n');

    if (lines.length === 1) {
      return (
        <Box>
          <Text>{lines[0]}</Text>
          {expectingNewline && <Text color="yellow"> (press 'n' for newline)</Text>}
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        {lines.map((line, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Lines position stable during editing
          <Text key={index}>{line || ' '}</Text>
        ))}
      </Box>
    );
  };

  return renderTextWithCursor();
}

// Helper function to replace a mention with a file path
export function replaceMention(
  text: string,
  mentionStart: number,
  mentionEnd: number,
  replacement: string
): string {
  return text.slice(0, mentionStart) + replacement + text.slice(mentionEnd);
}

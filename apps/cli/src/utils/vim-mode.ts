import type { Key } from 'ink';

export type VimMode = 'normal' | 'insert' | 'visual';

export interface VimState {
  mode: VimMode;
  visualStart?: number;
  visualEnd?: number;
  lastCommand?: string;
  yankedText?: string;
}

export interface VimAction {
  type: 'mode-change' | 'cursor-move' | 'text-change' | 'yank' | 'paste' | 'delete' | 'none';
  mode?: VimMode;
  cursorPosition?: number;
  text?: string;
  yankedText?: string;
  preventDefault?: boolean;
}

export function handleVimKeybinding(
  input: string,
  key: Key,
  state: VimState,
  value: string,
  cursorPosition: number
): VimAction {
  // ESC key - switch to normal mode from any mode
  if (key.escape) {
    if (state.mode !== 'normal') {
      return { type: 'mode-change', mode: 'normal', preventDefault: true };
    }
    return { type: 'none', preventDefault: true };
  }

  // Handle based on current mode
  switch (state.mode) {
    case 'normal':
      return handleNormalMode(input, key, state, value, cursorPosition);
    case 'insert':
      return handleInsertMode(input, key, state, value, cursorPosition);
    case 'visual':
      return handleVisualMode(input, key, state, value, cursorPosition);
    default:
      return { type: 'none' };
  }
}

function handleNormalMode(
  input: string,
  key: Key,
  state: VimState,
  value: string,
  cursorPosition: number
): VimAction {
  // Mode changes
  if (input === 'i') {
    return { type: 'mode-change', mode: 'insert', preventDefault: true };
  }
  if (input === 'I') {
    // Insert at beginning of line
    const lines = value.substring(0, cursorPosition).split('\n');
    const currentLineStart = cursorPosition - (lines[lines.length - 1]?.length || 0);
    return {
      type: 'mode-change',
      mode: 'insert',
      cursorPosition: currentLineStart,
      preventDefault: true,
    };
  }
  if (input === 'a') {
    // Append after cursor
    return {
      type: 'mode-change',
      mode: 'insert',
      cursorPosition: Math.min(value.length, cursorPosition + 1),
      preventDefault: true,
    };
  }
  if (input === 'A') {
    // Append at end of line
    const afterCursor = value.substring(cursorPosition);
    const nextNewline = afterCursor.indexOf('\n');
    const endOfLine = nextNewline === -1 ? value.length : cursorPosition + nextNewline;
    return {
      type: 'mode-change',
      mode: 'insert',
      cursorPosition: endOfLine,
      preventDefault: true,
    };
  }
  if (input === 'o') {
    // Open line below
    const afterCursor = value.substring(cursorPosition);
    const nextNewline = afterCursor.indexOf('\n');
    const endOfLine = nextNewline === -1 ? value.length : cursorPosition + nextNewline;
    const newValue = `${value.substring(0, endOfLine)}\n${value.substring(endOfLine)}`;
    return {
      type: 'text-change',
      text: newValue,
      cursorPosition: endOfLine + 1,
      mode: 'insert',
      preventDefault: true,
    };
  }
  if (input === 'O') {
    // Open line above
    const lines = value.substring(0, cursorPosition).split('\n');
    const currentLineStart = cursorPosition - (lines[lines.length - 1]?.length || 0);
    const newValue = `${value.substring(0, currentLineStart)}\n${value.substring(currentLineStart)}`;
    return {
      type: 'text-change',
      text: newValue,
      cursorPosition: currentLineStart,
      mode: 'insert',
      preventDefault: true,
    };
  }
  if (input === 'v') {
    return {
      type: 'mode-change',
      mode: 'visual',
      preventDefault: true,
    };
  }

  // Movement commands
  if (input === 'h' || key.leftArrow) {
    return {
      type: 'cursor-move',
      cursorPosition: Math.max(0, cursorPosition - 1),
      preventDefault: true,
    };
  }
  if (input === 'l' || key.rightArrow) {
    return {
      type: 'cursor-move',
      cursorPosition: Math.min(value.length, cursorPosition + 1),
      preventDefault: true,
    };
  }
  if (input === 'j' || key.downArrow) {
    // Move down a line
    const lines = value.split('\n');
    let currentLineStart = 0;
    let currentLineIndex = 0;
    let positionInLine = cursorPosition;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined) {
        continue;
      }
      const lineLength = line.length + (i < lines.length - 1 ? 1 : 0);
      if (cursorPosition <= currentLineStart + line.length) {
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
      const nextLine = lines[currentLineIndex + 1];
      if (nextLine === undefined) {
        return { type: 'none', preventDefault: true };
      }
      const newPosition = nextLineStart + Math.min(positionInLine, nextLine.length);
      return {
        type: 'cursor-move',
        cursorPosition: newPosition,
        preventDefault: true,
      };
    }
    return { type: 'none', preventDefault: true };
  }
  if (input === 'k' || key.upArrow) {
    // Move up a line
    const lines = value.split('\n');
    let currentLineStart = 0;
    let currentLineIndex = 0;
    let positionInLine = cursorPosition;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined) {
        continue;
      }
      const lineLength = line.length + (i < lines.length - 1 ? 1 : 0);
      if (cursorPosition <= currentLineStart + line.length) {
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
      const previousLine = lines[currentLineIndex - 1];
      if (previousLine === undefined) {
        return { type: 'none', preventDefault: true };
      }
      const newPosition = previousLineStart + Math.min(positionInLine, previousLine.length);
      return {
        type: 'cursor-move',
        cursorPosition: newPosition,
        preventDefault: true,
      };
    }
    return { type: 'none', preventDefault: true };
  }
  if (input === '0') {
    // Beginning of line
    const lines = value.substring(0, cursorPosition).split('\n');
    const currentLineStart = cursorPosition - (lines[lines.length - 1]?.length || 0);
    return {
      type: 'cursor-move',
      cursorPosition: currentLineStart,
      preventDefault: true,
    };
  }
  if (input === '$') {
    // End of line
    const afterCursor = value.substring(cursorPosition);
    const nextNewline = afterCursor.indexOf('\n');
    const endOfLine = nextNewline === -1 ? value.length : cursorPosition + nextNewline;
    return {
      type: 'cursor-move',
      cursorPosition: Math.max(0, endOfLine - 1),
      preventDefault: true,
    };
  }
  if (input === 'w') {
    // Next word
    const afterCursor = value.substring(cursorPosition);
    const match = afterCursor.match(/[^\w\s]\s*\w|\s+\w|$/);
    if (match && match.index !== undefined) {
      return {
        type: 'cursor-move',
        cursorPosition: Math.min(value.length, cursorPosition + match.index + 1),
        preventDefault: true,
      };
    }
    return { type: 'none', preventDefault: true };
  }
  if (input === 'b') {
    // Previous word
    const beforeCursor = value.substring(0, cursorPosition);
    const reversed = beforeCursor.split('').reverse().join('');
    const match = reversed.match(/\w+\s*[^\w\s]|\w+\s+|^\w+/);
    if (match && match.index !== undefined) {
      return {
        type: 'cursor-move',
        cursorPosition: Math.max(0, cursorPosition - match.index - match[0].length),
        preventDefault: true,
      };
    }
    return { type: 'none', preventDefault: true };
  }
  if (input === 'G') {
    // Go to last line
    return {
      type: 'cursor-move',
      cursorPosition: value.length,
      preventDefault: true,
    };
  }
  if (input === 'g' && state.lastCommand === 'g') {
    // gg - Go to first line
    return {
      type: 'cursor-move',
      cursorPosition: 0,
      preventDefault: true,
    };
  }

  // Delete operations
  if (input === 'x') {
    // Delete character under cursor
    if (cursorPosition < value.length) {
      const newValue = value.substring(0, cursorPosition) + value.substring(cursorPosition + 1);
      return {
        type: 'text-change',
        text: newValue,
        preventDefault: true,
      };
    }
    return { type: 'none', preventDefault: true };
  }
  if (input === 'd' && state.lastCommand === 'd') {
    // dd - Delete line
    const lines = value.split('\n');
    let currentLineStart = 0;
    let currentLineIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined) {
        continue;
      }
      const lineLength = line.length + (i < lines.length - 1 ? 1 : 0);
      if (cursorPosition <= currentLineStart + line.length) {
        currentLineIndex = i;
        break;
      }
      currentLineStart += lineLength;
    }

    const deletedLine = lines[currentLineIndex];
    lines.splice(currentLineIndex, 1);
    const newValue = lines.join('\n');
    const newCursor = Math.min(currentLineStart, newValue.length);

    return {
      type: 'delete',
      text: newValue,
      cursorPosition: newCursor,
      yankedText: deletedLine || '',
      preventDefault: true,
    };
  }

  // Yank operations
  if (input === 'y' && state.lastCommand === 'y') {
    // yy - Yank line
    const lines = value.split('\n');
    let currentLineIndex = 0;
    let currentLineStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined) {
        continue;
      }
      const lineLength = line.length + (i < lines.length - 1 ? 1 : 0);
      if (cursorPosition <= currentLineStart + line.length) {
        currentLineIndex = i;
        break;
      }
      currentLineStart += lineLength;
    }

    const yankedText = lines[currentLineIndex];
    if (yankedText === undefined) {
      return { type: 'none', preventDefault: true };
    }
    return {
      type: 'yank',
      yankedText,
      preventDefault: true,
    };
  }

  // Paste operations
  if (input === 'p' && state.yankedText) {
    // Paste after cursor
    const newValue =
      value.substring(0, cursorPosition + 1) +
      state.yankedText +
      value.substring(cursorPosition + 1);
    return {
      type: 'paste',
      text: newValue,
      cursorPosition: cursorPosition + state.yankedText.length,
      preventDefault: true,
    };
  }
  if (input === 'P' && state.yankedText) {
    // Paste before cursor
    const newValue =
      value.substring(0, cursorPosition) + state.yankedText + value.substring(cursorPosition);
    return {
      type: 'paste',
      text: newValue,
      cursorPosition: cursorPosition + state.yankedText.length - 1,
      preventDefault: true,
    };
  }

  return { type: 'none', preventDefault: true };
}

function handleInsertMode(
  _input: string,
  _key: Key,
  _state: VimState,
  _value: string,
  _cursorPosition: number
): VimAction {
  // In insert mode, only ESC is handled (already handled above)
  // All other input is passed through normally
  return { type: 'none', preventDefault: false };
}

function handleVisualMode(
  input: string,
  key: Key,
  state: VimState,
  value: string,
  cursorPosition: number
): VimAction {
  // Visual mode movements (same as normal mode)
  const normalAction = handleNormalMode(input, key, state, value, cursorPosition);

  // Override some commands for visual mode
  if (input === 'd' || input === 'x') {
    // Delete selection
    const start = Math.min(state.visualStart || cursorPosition, cursorPosition);
    const end = Math.max(state.visualStart || cursorPosition, cursorPosition);
    const deletedText = value.substring(start, end + 1);
    const newValue = value.substring(0, start) + value.substring(end + 1);
    return {
      type: 'delete',
      text: newValue,
      cursorPosition: start,
      yankedText: deletedText,
      mode: 'normal',
      preventDefault: true,
    };
  }

  if (input === 'y') {
    // Yank selection
    const start = Math.min(state.visualStart || cursorPosition, cursorPosition);
    const end = Math.max(state.visualStart || cursorPosition, cursorPosition);
    const yankedText = value.substring(start, end + 1);
    return {
      type: 'yank',
      yankedText,
      mode: 'normal',
      preventDefault: true,
    };
  }

  return normalAction;
}

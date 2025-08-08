'use client';

import { isHotkey } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

export const UNDO_REDO_KIT_KEY = 'undo-redo';

export const UndoRedoKit = [
  createPlatePlugin({
    key: UNDO_REDO_KIT_KEY,
    handlers: {
      onKeyDown: ({ editor, event }) => {
        // Undo: mod+z (Cmd+Z on macOS, Ctrl+Z on Windows/Linux)
        if (isHotkey('mod+z')(event)) {
          event.preventDefault();
          editor.undo();
          return false;
        }

        // Redo: mod+shift+z (common on macOS) or mod+y (common on Windows/Linux)
        if (isHotkey('mod+shift+z')(event) || isHotkey('mod+y')(event)) {
          event.preventDefault();
          editor.redo();
          return false;
        }

        return true;
      }
    }
  })
];
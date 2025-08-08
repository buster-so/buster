'use client';

import { createPlatePlugin, Key } from 'platejs/react';

export const UNDO_REDO_KIT_KEY = 'undo-redo';

export const UndoRedoKit = [
  createPlatePlugin({ key: UNDO_REDO_KIT_KEY }).extend({
    shortcuts: {
      undo: {
        keys: [[Key.Mod, 'z']],
        handler: ({ editor }) => {
          editor.undo();
        }
      },
      redo: {
        // Support both common redo shortcuts
        keys: [
          [Key.Mod, Key.Shift, 'z'],
          [Key.Mod, 'y']
        ],
        handler: ({ editor }) => {
          editor.redo();
        }
      }
    }
  })
];
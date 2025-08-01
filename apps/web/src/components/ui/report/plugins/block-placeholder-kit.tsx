'use client';

import { KEYS } from 'platejs';
import { BlockPlaceholderPlugin } from 'platejs/react';

export const BlockPlaceholderKit = [
  BlockPlaceholderPlugin.configure({
    options: {
      className:
        'before:absolute before:cursor-text before:opacity-30 before:content-[attr(placeholder)]',
      placeholders: {
        [KEYS.p]: 'Type something...'
      },
      query: ({ path }) => {
        return path.length === 1;
      }
    }
  })
];

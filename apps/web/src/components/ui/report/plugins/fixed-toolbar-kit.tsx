'use client';

import { createPlatePlugin } from 'platejs/react';

import { FixedToolbar } from '../elements/FixedToolbar';
import { FixedToolbarButtons } from '../elements/FixedToolbarButtons';

export const FixedToolbarKit = [
  createPlatePlugin({
    key: 'fixed-toolbar',
    render: {
      beforeEditable: () => (
        <FixedToolbar>
          <FixedToolbarButtons />
        </FixedToolbar>
      )
    }
  })
];

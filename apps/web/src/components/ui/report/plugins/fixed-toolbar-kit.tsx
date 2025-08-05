'use client';

import { createPlatePlugin } from 'platejs/react';

import { FixedToolbar } from '../elements/FixedToolbar';
import { FixedToolbarButtons } from '../elements/FixedToolbarButtons';

export const FIXED_TOOLBAR_KIT_KEY = 'fixed-toolbar';

export const FixedToolbarKit = [
  createPlatePlugin({
    key: FIXED_TOOLBAR_KIT_KEY,
    render: {
      beforeEditable: () => (
        <FixedToolbar>
          <FixedToolbarButtons />
        </FixedToolbar>
      )
    }
  })
];

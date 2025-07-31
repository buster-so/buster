'use client';

import { createPlatePlugin } from 'platejs/react';

import { FloatingToolbar } from '../elements/FloatingToolbar';
import { FloatingToolbarButtons } from '../elements/FloatingToolbarButtons';

export const FloatingToolbarKit = [
  createPlatePlugin({
    key: 'floating-toolbar',
    render: {
      afterEditable: () => (
        <FloatingToolbar>
          <FloatingToolbarButtons />
        </FloatingToolbar>
      )
    }
  })
];

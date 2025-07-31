'use client';

import { LinkPlugin } from '@platejs/link/react';

import { LinkElement } from '../elements/LinkNode';
import { LinkFloatingToolbar } from '../elements/LinkFloatingToolbar';

export const LinkKit = [
  LinkPlugin.configure({
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />
    }
  })
];

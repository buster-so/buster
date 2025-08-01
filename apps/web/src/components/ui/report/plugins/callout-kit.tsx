'use client';

import { CalloutPlugin } from '@platejs/callout/react';

import { CalloutElement } from '../elements/CalloutNode';

export const CalloutKit = [
  CalloutPlugin.configure({
    node: {
      component: CalloutElement
    }
  })
];

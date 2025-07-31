'use client';

import { TocPlugin } from '@platejs/toc/react';

import { TocElement } from '../elements/TocNode';

export const TocKit = [
  TocPlugin.configure({
    options: {
      // isScroll: true,
      topOffset: 80
    }
  }).withComponent(TocElement)
];

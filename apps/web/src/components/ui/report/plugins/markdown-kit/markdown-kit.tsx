'use client';

import { MarkdownPlugin as PlateMarkdownPlugin } from '@platejs/markdown';
import { remarkMdx, remarkMention } from '@platejs/markdown';
import remarkGfm from 'remark-gfm';
import { calloutSerializer } from './callout-serializer';
import { metricSerializer } from './metric-serializer';

const MarkdownPlugin = PlateMarkdownPlugin.configure({
  options: {
    remarkPlugins: [remarkGfm, remarkMdx, remarkMention],
    rules: {
      callout: calloutSerializer,
      metric: metricSerializer
    }
  }
});

export const MarkdownKit = [MarkdownPlugin];

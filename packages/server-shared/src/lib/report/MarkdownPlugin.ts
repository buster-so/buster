import { MarkdownPlugin as PlateMarkdownPlugin } from '@platejs/markdown';
import { remarkMdx, remarkMention } from '@platejs/markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { calloutSerializer } from './callout-serializer';

export const MarkdownPlugin = PlateMarkdownPlugin.configure({
  options: {
    remarkPlugins: [remarkGfm, remarkMdx, remarkMention, remarkMath],
    rules: {
      callout: calloutSerializer,
    },
  },
});

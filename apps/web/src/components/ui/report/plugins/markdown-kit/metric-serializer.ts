import type { MetricElement, TextElement } from '@buster/server-shared/reports';
import { type MdRules, parseAttributes, serializeMd } from '@platejs/markdown';
import { escapeHtmlAttribute, unescapeHtmlAttribute } from './escape-handlers';

type MetricMdNode = MdRules['metric'];

export const metricSerializer: MetricMdNode = {
  serialize: (node: MetricElement, options) => {
    const width = node.width;
    const metricId = node.metricId;
    const caption = node.caption;
    const captionText: string = caption?.map((c) => (c as TextElement)?.text)?.join(' ') || '';

    if (!options.editor) {
      throw new Error('Editor is required');
    }

    const hasWidth =
      width !== undefined &&
      width !== null &&
      width !== '' &&
      width !== 0 &&
      width !== '0' &&
      width !== 'auto' &&
      width !== '0px';

    // Escape special characters in caption for safe HTML attribute insertion
    const escapedCaption = escapeHtmlAttribute(captionText);

    return {
      type: 'html',
      value: `<metric metricId="${metricId}" versionNumber="${node.versionNumber || ''}" width="${hasWidth ? width : '100%'}" caption="${escapedCaption}"></metric>`,
    };
  },
  deserialize: (node): MetricElement => {
    // Extract the icon attribute from the HTML element
    const typedAttributes = parseAttributes(node.attributes) as {
      metricId: string;
      width: string | number;
      caption: string | undefined;
    };

    // Unescape the caption if it exists
    const unescapedCaption = typedAttributes.caption
      ? unescapeHtmlAttribute(typedAttributes.caption)
      : undefined;

    // Return the PlateJS node structure
    return {
      type: 'metric',
      metricId: typedAttributes.metricId,
      caption: unescapedCaption ? [{ text: unescapedCaption }] : undefined,
      width: typedAttributes.width,
      children: [{ text: '' }],
    };
  },
};

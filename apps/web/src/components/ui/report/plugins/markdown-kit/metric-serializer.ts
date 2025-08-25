import type { MetricElement, TextElement } from '@buster/server-shared/reports';
import { type MdRules, parseAttributes } from '@platejs/markdown';

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

    return {
      type: 'html',
      value: `<metric metricId="${metricId}" width="${hasWidth ? width : '100%'}" caption="${captionText}"></metric>`
    };
  },
  deserialize: (node): MetricElement => {
    // Extract the icon attribute from the HTML element
    const typedAttributes = parseAttributes(node.attributes) as {
      metricId: string;
      width: string | number;
      caption: string | undefined;
    };

    // Return the PlateJS node structure
    return {
      type: 'metric',
      metricId: typedAttributes.metricId,
      caption: typedAttributes.caption ? [{ text: typedAttributes.caption }] : undefined,
      width: typedAttributes.width,
      children: [{ text: '' }]
    };
  }
};

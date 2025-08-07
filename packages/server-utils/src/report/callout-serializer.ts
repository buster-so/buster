import {
  type MdNodeParser,
  convertChildrenDeserialize,
  parseAttributes,
  serializeMd,
} from '@platejs/markdown';

export const calloutSerializer: MdNodeParser<'callout'> = {
  serialize: (node, options) => {
    // Extract the icon from the node (assuming it's stored as an attribute)
    const icon = node.icon || '💡';

    if (!options.editor) {
      throw new Error('Editor is required');
    }

    const content = serializeMd(options.editor, {
      ...options,
      value: node.children,
    });

    return {
      type: 'html',
      value: `<callout icon="${icon}">${content}</callout>`,
    };
  },
  deserialize: (node, deco, options) => {
    // Extract the icon attribute from the HTML element
    const typedAttributes = parseAttributes(node.attributes) as {
      icon: string;
    };

    // Return the PlateJS node structure
    return {
      type: 'callout',
      icon: typedAttributes.icon,
      children: convertChildrenDeserialize(node.children, deco, options),
    };
  },
};

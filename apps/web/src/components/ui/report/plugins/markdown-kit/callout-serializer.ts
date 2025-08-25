import {
  type MdNodeParser,
  convertChildrenDeserialize,
  deserializeMd,
  parseAttributes,
  serializeMd
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
      value: node.children
    });

    return {
      type: 'html',
      value: `<callout icon="${icon}" content="${content}"></callout>`
    };
  },
  deserialize: (node, deco, options) => {
    // Extract the icon attribute from the HTML element
    const typedAttributes = parseAttributes(node.attributes) as {
      icon: string;
      content: string;
    };

    if (!options.editor) {
      throw new Error('Editor is required');
    }

    try {
      const deserializedContent = deserializeMd(options.editor, typedAttributes.content);
      return {
        type: 'callout',
        icon: typedAttributes.icon,
        children: deserializedContent
      };
    } catch (error) {
      console.error('Error deserializing content', error);
      return {
        type: 'callout',
        icon: typedAttributes.icon,
        children: [{ text: typedAttributes.content }]
      };
    }
  }
};

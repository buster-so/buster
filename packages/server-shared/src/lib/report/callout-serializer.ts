import {
  type MdNodeParser,
  convertChildrenDeserialize,
  convertNodesSerialize,
  parseAttributes,
} from '@platejs/markdown';

export const calloutSerializer: MdNodeParser<'callout'> = {
  serialize: (node, options) => {
    // Extract the icon from the node (assuming it's stored as an attribute)
    const icon = node.icon || '💡';
    const content = convertNodesSerialize(node.children, options);

    // Return the markdown representation
    return {
      attributes: {
        icon,
      },
      children: content,
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

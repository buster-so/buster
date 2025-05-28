import React from 'react';

import type { iconProps } from './iconProps';

function caretExpandY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px caret expand y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m6.2.865l2.249,2.985c.124.165.007.4-.2.4H3.751c-.206,0-.324-.236-.2-.4L5.8.865c.1-.133.299-.133.399,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6.2,11.135l2.249-2.985c.124-.165.007-.4-.2-.4H3.751c-.206,0-.324.236-.2.4l2.249,2.985c.1.133.299.133.399,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default caretExpandY;

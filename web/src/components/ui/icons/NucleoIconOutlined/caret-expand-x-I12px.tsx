import React from 'react';

import type { iconProps } from './iconProps';

function caretExpandX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px caret expand x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m.865,5.8l2.985-2.249c.165-.124.4-.007.4.2v4.497c0,.206-.236.324-.4.2L.865,6.2c-.133-.1-.133-.299,0-.399Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m11.135,5.8l-2.985-2.249c-.165-.124-.4-.007-.4.2v4.497c0,.206.236.324.4.2l2.985-2.249c.133-.1.133-.299,0-.399Z"
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

export default caretExpandX;

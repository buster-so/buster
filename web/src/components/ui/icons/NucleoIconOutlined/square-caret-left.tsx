import React from 'react';

import type { iconProps } from './iconProps';

function squareCaretLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square caret left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="12.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 9 9)"
          x="2.75"
          y="2.75"
        />
        <path
          d="M6.843,9.621l2.987,2.022c.498,.337,1.17-.02,1.17-.621V6.978c0-.601-.672-.958-1.17-.621l-2.987,2.022c-.439,.297-.439,.945,0,1.242Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareCaretLeft;

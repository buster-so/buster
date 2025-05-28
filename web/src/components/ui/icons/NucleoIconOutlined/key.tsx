import React from 'react';

import type { iconProps } from './iconProps';

function key(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px key';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.747,2.076l-2.847,.177-5.891,5.891c-.324-.084-.658-.144-1.009-.144-2.209,0-4,1.791-4,4s1.791,4,4,4,4-1.791,4-4c0-.362-.064-.707-.154-1.041l1.904-1.959v-2.25h2.25l1.753-1.645-.006-3.029Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.5" cy="12.5" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default key;

import React from 'react';

import type { iconProps } from './iconProps';

function savedItems(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px saved items';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.75,2.75h1.5c1.105,0,2,.895,2,2V13.25c0,1.105-.895,2-2,2H4.75c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2h1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75 10.25L9 8.25 6.25 10.25 6.25 2.75 11.75 2.75 11.75 10.25z"
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

export default savedItems;

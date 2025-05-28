import React from 'react';

import type { iconProps } from './iconProps';

function squareLayoutGrid5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px square layout grid 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m4,4V.5h-.75C1.733.5.5,1.733.5,3.25v.75h3.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m5.5,5.5v6h3.25c1.517,0,2.75-1.233,2.75-2.75v-3.25h-6Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m5.5,4h6v-.75c0-1.517-1.233-2.75-2.75-2.75h-3.25v3.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4,5.5H.5v3.25c0,1.517,1.233,2.75,2.75,2.75h.75v-6Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default squareLayoutGrid5;

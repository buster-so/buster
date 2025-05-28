import React from 'react';

import type { iconProps } from './iconProps';

function tree2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tree 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 16.25L9 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75,13.25h.75c2.071,0,3.75-1.679,3.75-3.75,0-1.902-1.42-3.456-3.255-3.7,0-.017,.005-.033,.005-.05,0-2.209-1.791-4-4-4s-4,1.791-4,4c0,.017,.005,.033,.005,.05-1.835,.245-3.255,1.799-3.255,3.7,0,2.071,1.679,3.75,3.75,3.75h.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 12.25L6.5 9.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 10.5L11 8.5"
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

export default tree2;

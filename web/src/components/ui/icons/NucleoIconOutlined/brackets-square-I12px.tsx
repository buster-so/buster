import React from 'react';

import type { iconProps } from './iconProps';

function bracketsSquare(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px brackets square';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8 10.75L10.75 10.75 10.75 1.25 8 1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4 10.75L1.25 10.75 1.25 1.25 4 1.25"
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

export default bracketsSquare;

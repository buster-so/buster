import React from 'react';

import type { iconProps } from './iconProps';

function textA(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px text a';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.042 8.25L8.958 8.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.99 10.75L6.305 1.25 5.695 1.25 2.01 10.75"
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

export default textA;

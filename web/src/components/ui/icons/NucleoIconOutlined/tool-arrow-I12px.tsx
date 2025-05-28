import React from 'react';

import type { iconProps } from './iconProps';

function toolArrow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px tool arrow';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.25 10.75L7.417 4.583"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 2.917L10.75 1.25 9.083 6.25 5.75 2.917z"
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

export default toolArrow;

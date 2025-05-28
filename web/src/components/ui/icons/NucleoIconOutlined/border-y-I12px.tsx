import React from 'react';

import type { iconProps } from './iconProps';

function borderY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px border y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.25 1.25L10.75 1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75 10.75L1.25 10.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="6" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="6" cy="3.25" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="6" cy="8.75" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default borderY;

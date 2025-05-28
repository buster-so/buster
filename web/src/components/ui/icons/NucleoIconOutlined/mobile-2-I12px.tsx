import React from 'react';

import type { iconProps } from './iconProps';

function mobile2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px mobile 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="8.5"
          width="10.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 6 6)"
          x=".75"
          y="1.75"
        />
        <path
          d="M7.25 0.75L7.25 1.75 4.75 1.75 4.75 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="8.5" fill="currentColor" r="1" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default mobile2;

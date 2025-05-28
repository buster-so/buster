import React from 'react';

import type { iconProps } from './iconProps';

function lockPassword(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px lock password';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75,6.75V4c0-1.795,1.455-3.25,3.25-3.25h0c1.795,0,3.25,1.455,3.25,3.25v2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 9.5L9 10.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="6.5"
          width="10.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="3.75"
          y="6.75"
        />
        <circle cx="2.25" cy="16.75" fill="currentColor" r="1.25" />
        <circle cx="6.75" cy="16.75" fill="currentColor" r="1.25" />
        <circle cx="11.25" cy="16.75" fill="currentColor" r="1.25" />
        <circle cx="15.75" cy="16.75" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default lockPassword;

import React from 'react';

import type { iconProps } from './iconProps';

function faceWoozy(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face woozy';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="9" fill="currentColor" r="1" />
        <circle cx="11.5" cy="8.5" fill="currentColor" r="1.5" />
        <path
          d="M7,12.164c.552,.552,1.448,.552,2,0s1.448-.552,2,0"
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

export default faceWoozy;

import React from 'react';

import type { iconProps } from './iconProps';

function chair(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chair';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 12.75L9 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 16.25L12.25 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,10.75c-1.607-.388-3.737-.744-6.25-.744-1.654,0-3.807,.154-6.25,.744"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25,7.75V3.75c0-1.105,.895-2,2-2h3.5c1.105,0,2,.895,2,2V7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,6.75v4c0,1.105-.895,2-2,2H4.75c-1.105,0-2-.895-2-2V6.75"
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

export default chair;

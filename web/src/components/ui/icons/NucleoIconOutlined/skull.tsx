import React from 'react';

import type { iconProps } from './iconProps';

function skull(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px skull';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.75 14.25L7.75 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.25 14.25L10.25 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8 11.75L9 10.75 10 11.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,8.5c0-4.17-3.782-7.457-8.103-6.619-2.667,.518-4.801,2.688-5.283,5.361-.223,1.236-.093,2.418,.282,3.486-.249,.362-.396,.799-.396,1.272,0,1.243,1.007,2.25,2.25,2.25,.264,0,.514-.054,.75-.138v1.138c0,.552,.448,1,1,1h5.5c.552,0,1-.448,1-1v-1.138c.236,.084,.486,.138,.75,.138,1.243,0,2.25-1.007,2.25-2.25,0-.47-.145-.905-.391-1.266,.246-.7,.391-1.449,.391-2.234Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.5" cy="9.5" fill="currentColor" r="1.5" />
        <circle cx="12.5" cy="9.5" fill="currentColor" r="1.5" />
      </g>
    </svg>
  );
}

export default skull;

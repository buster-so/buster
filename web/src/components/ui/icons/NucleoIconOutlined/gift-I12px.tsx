import React from 'react';

import type { iconProps } from './iconProps';

function gift(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px gift';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6 3.75L6 10.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.75,2.25c0-.828.635-1.5,1.417-1.5,2.096,0,2.833,3,2.833,3h-2.833c-.782,0-1.417-.672-1.417-1.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m8.833,3.75h-2.833s.737-3,2.833-3c.782,0,1.417.672,1.417,1.5,0,.828-.635,1.5-1.417,1.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 3.75L0.75 3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.25,3.75v5c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2V3.75"
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

export default gift;

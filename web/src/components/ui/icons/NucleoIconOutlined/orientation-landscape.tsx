import React from 'react';

import type { iconProps } from './iconProps';

function orientationLandscape(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px orientation landscape';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75 13.25L2.75 5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M0.75 6.75L2.75 4.75 4.75 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,7.284v3.431c0,.557,.6,.945,1.087,.675,.842-.466,1.413-1.359,1.413-2.391s-.571-1.925-1.413-2.391c-.487-.27-1.087,.118-1.087,.675Z"
          fill="currentColor"
        />
        <circle cx="13.25" cy="9" fill="currentColor" r="1.25" />
        <rect
          height="12.5"
          width="9"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="7.25"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default orientationLandscape;

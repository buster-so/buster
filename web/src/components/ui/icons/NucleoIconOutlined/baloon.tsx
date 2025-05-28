import React from 'react';

import type { iconProps } from './iconProps';

function baloon(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px baloon';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.655,17.25c-.431-.431-.431-1.13,0-1.56l.375-.379c.431-.431,.431-1.13,0-1.56h0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,7.75c0-1.897,1.259-3.5,2.75-3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <ellipse
          cx="9"
          cy="7.75"
          fill="none"
          rx="5.25"
          ry="6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default baloon;

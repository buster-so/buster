import React from 'react';

import type { iconProps } from './iconProps';

function cake(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cake';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 7.75L9 4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,4.75c.838,0,1.517-.681,1.517-1.522,0-1.156-1.517-2.478-1.517-2.478,0,0-1.517,1.322-1.517,2.478,0,.841,.679,1.522,1.517,1.522Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,11c-.992,0-1.259,1-2.25,1s-1.259-1-2.25-1-1.259,1-2.25,1-1.259-1-2.25-1-1.259,1-2.25,1-1.259-1-2.25-1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="7.5"
          width="13.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.25"
          y="7.75"
        />
      </g>
    </svg>
  );
}

export default cake;

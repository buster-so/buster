import React from 'react';

import type { iconProps } from './iconProps';

function progressBar(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px progress bar';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75 11.75L9 11.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.404,5.052l1.757-2.53c.226-.326-.007-.772-.404-.772h-3.513c-.397,0-.63,.446-.404,.772l1.757,2.53c.196,.282,.612,.282,.808,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="6"
          width="16.5"
          fill="none"
          rx="3"
          ry="3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x=".75"
          y="8.75"
        />
      </g>
    </svg>
  );
}

export default progressBar;

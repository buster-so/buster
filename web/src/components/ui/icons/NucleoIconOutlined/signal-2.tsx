import React from 'react';

import type { iconProps } from './iconProps';

function signal2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px signal 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.939,13.72c.586-.586,1.536-.586,2.121,0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.818,11.598c1.757-1.757,4.607-1.757,6.364,0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.697,9.477c2.929-2.929,7.678-2.929,10.607,0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.575,7.356c4.101-4.101,10.749-4.101,14.849,0"
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

export default signal2;

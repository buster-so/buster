import React from 'react';

import type { iconProps } from './iconProps';

function flask(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flask';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.068 11.25L12.932 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25,1.75V7l-3.628,7.065c-.513,.998,.212,2.185,1.334,2.185H13.044c1.122,0,1.847-1.187,1.334-2.185l-3.628-7.065V1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 1.75L12.25 1.75"
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

export default flask;

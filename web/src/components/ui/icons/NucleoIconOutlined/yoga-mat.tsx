import React from 'react';

import type { iconProps } from './iconProps';

function yogaMat(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px yoga mat';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75,12.25c0,1.381,1.119,2.5,2.5,2.5H15.25c.552,0,1-.448,1-1V5.25c0-.552-.448-1-1-1h-5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75,4.75v7.5c0-1.381-1.119-2.5-2.5-2.5s-2.5,1.119-2.5,2.5V4.75c0-1.381,1.119-2.5,2.5-2.5s2.5,1.119,2.5,2.5Z"
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

export default yogaMat;

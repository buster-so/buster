import React from 'react';

import type { iconProps } from './iconProps';

function humidity(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px humidity';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2,9.75c1.521,0,2-1.5,3.5-1.5s2.021,1.5,3.5,1.5c1.542,0,2.042-1.5,3.5-1.5s2.021,1.5,3.5,1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2,5.75c1.521,0,2-1.5,3.5-1.5s2.021,1.5,3.5,1.5c1.542,0,2.042-1.5,3.5-1.5s2.021,1.5,3.5,1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2,13.75c1.521,0,2-1.5,3.5-1.5s2.021,1.5,3.5,1.5c1.542,0,2.042-1.5,3.5-1.5s2.021,1.5,3.5,1.5"
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

export default humidity;

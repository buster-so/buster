import React from 'react';

import type { iconProps } from './iconProps';

function chartPie(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chart pie';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m3.5,1.41C1.869,2.301.75,4.011.75,6c0,2.899,2.351,5.25,5.25,5.25,1.989,0,3.699-1.119,4.59-2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6,.75v5.25h5.25c0-2.9-2.351-5.25-5.25-5.25Z"
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

export default chartPie;

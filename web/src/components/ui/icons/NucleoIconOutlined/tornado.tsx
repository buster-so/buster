import React from 'react';

import type { iconProps } from './iconProps';

function tornado(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tornado';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.295,9c-.927,.733-3.173,1.25-5.795,1.25-3.452,0-6.25-.895-6.25-2,0-.603,.834-1.144,2.153-1.51"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.245,12c-.843,.591-2.65,1-4.745,1-2.899,0-5.25-.784-5.25-1.75,0-.47,.555-.896,1.459-1.211"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.557,15c-.757,.305-1.901,.5-3.182,.5-2.278,0-4.125-.616-4.125-1.375,0-.616,1.214-1.137,2.887-1.312"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <ellipse
          cx="9"
          cy="5"
          fill="none"
          rx="7.25"
          ry="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default tornado;

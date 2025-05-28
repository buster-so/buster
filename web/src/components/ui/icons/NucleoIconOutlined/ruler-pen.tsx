import React from 'react';

import type { iconProps } from './iconProps';

function rulerPen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ruler pen';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.533,5.437l-3.331-3.331c-.391-.391-1.024-.391-1.414,0l-2.682,2.682c-.391,.391-.391,1.024,0,1.414l3.331,3.331"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.467,12.563l3.331,3.331c.391,.391,1.024,.391,1.414,0l2.682-2.682c.391-.391,.391-1.024,0-1.414l-1.581-1.581"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.416 7.513L5.184 5.745"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.487 14.584L12.255 12.816"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25,15.75s3.599-.568,4.546-1.515c.947-.947,8.577-8.577,8.577-8.577,.837-.837,.837-2.194,0-3.03-.837-.837-2.194-.837-3.03,0,0,0-7.63,7.63-8.577,8.577s-1.515,4.546-1.515,4.546h0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.121 3.848L14.152 6.879"
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

export default rulerPen;

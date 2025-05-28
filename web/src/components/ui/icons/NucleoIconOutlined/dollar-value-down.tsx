import React from 'react';

import type { iconProps } from './iconProps';

function dollarValueDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dollar value down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m2,11.75l2.588,2.588c.254.254.626.353.973.257l6.127-1.69c.347-.096.719.002.973.257l3.588,3.588"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 13.25L16.25 16.75 12.75 16.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m3.323,9.696c-.209-.61-.323-1.265-.323-1.946,0-3.314,2.686-6,6-6s6,2.686,6,6c0,1.073-.282,2.081-.775,2.952"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.8182,5.25h-2.6137c-.6904,0-1.25.5596-1.2501,1.2499h0c0,.6905.5596,1.2503,1.2501,1.2503h1.5912c.6902,0,1.2499.5595,1.2499,1.2498h0c0,.6904-.5596,1.25-1.2499,1.25h-2.614"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 4L9 5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 11.5L9 10.5"
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

export default dollarValueDown;

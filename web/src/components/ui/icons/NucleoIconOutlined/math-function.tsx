import React from 'react';

import type { iconProps } from './iconProps';

function mathFunction(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px math function';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.75 7.25L9.75 7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25,13.909c0,1.017,.797,1.841,1.781,1.841h0c3.859,0,2.078-13.5,5.938-13.5,.984,0,1.781,.824,1.781,1.841"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.667,10.25c2.75,0,2.2,5.5,4.95,5.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.167,10.25c-2.75,0-3.3,5.5-6.6,5.5"
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

export default mathFunction;

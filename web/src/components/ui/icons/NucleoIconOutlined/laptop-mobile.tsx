import React from 'react';

import type { iconProps } from './iconProps';

function laptopMobile(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px laptop mobile';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="5.5"
          width="8.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 13.5 12)"
          x="9.25"
          y="9.25"
        />
        <path
          d="M1.75 13L8 13"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,5v-.25c0-1.105-.895-2-2-2H4.75c-1.105,0-2,.895-2,2v6.375c0,1.036,.839,1.875,1.875,1.875h0"
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

export default laptopMobile;

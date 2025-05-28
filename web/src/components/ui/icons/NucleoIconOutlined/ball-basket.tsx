import React from 'react';

import type { iconProps } from './iconProps';

function ballBasket(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ball basket';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.652,1.759c-.494,.437-3.396,3.091-3.496,7.459-.086,3.759,1.959,6.291,2.483,6.903"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.77,9.532c1.191,.411,2.625,.782,4.268,.967,4.479,.504,8.135-.642,10.212-1.499"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.147,13.277s1.147-.668,2.52-.668c2.203,0,4.666,2.287,8.238,1.727"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.147,4.722c.697,1.528,.145,3.202,2.124,3.202,4.063,0,4.729-3.987,8.918-3.987"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default ballBasket;

import React from 'react';

import type { iconProps } from './iconProps';

function dollarValueUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dollar value up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m3.904,10.919c-.573-.92-.904-2.006-.904-3.169,0-3.314,2.686-6,6-6s6,2.686,6,6c0,.249-.015.495-.045.737"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m2,16.25l2.588-2.588c.254-.254.626-.353.973-.257l6.127,1.69c.347.096.719-.002.973-.257l3.588-3.588"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 14.75L16.25 11.25 12.75 11.25"
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

export default dollarValueUp;

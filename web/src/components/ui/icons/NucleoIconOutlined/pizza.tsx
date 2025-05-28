import React from 'react';

import type { iconProps } from './iconProps';

function pizza(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pizza';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="7.25" cy="8.25" fill="currentColor" r=".75" />
        <circle cx="10.75" cy="10.25" fill="currentColor" r=".75" />
        <circle cx="7.75" cy="10.75" fill="currentColor" r=".75" />
        <path
          d="M16.102,7.537c.097,.472,.148,.962,.148,1.463,0,4.004-3.246,7.25-7.25,7.25S1.75,13.004,1.75,9C1.75,5.638,4.039,2.81,7.143,1.99"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.745,8.781c.003,.072,.005,.145,.005,.219,0,2.623-2.127,4.75-4.75,4.75s-4.75-2.127-4.75-4.75c0-1.952,1.177-3.629,2.861-4.36"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.75,3.25c1.758,0,3.293,.955,4.114,2.375"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.75,8l6.28-3.626c-1.254-2.167-3.596-3.624-6.28-3.624v7.25Z"
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

export default pizza;

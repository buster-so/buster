import React from 'react';

import type { iconProps } from './iconProps';

function moonCloud(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px moon cloud';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.172,9c.209-.39,.369-.811,.47-1.254-.361,.083-.732,.135-1.118,.135-2.769,0-5.014-2.245-5.014-5.014,0-.386,.053-.757,.135-1.118-2.229,.51-3.896,2.495-3.896,4.878,0,.125,.005,.249,.014,.372"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75,11.25c-.413,0-.797,.11-1.14,.287-.427-1.602-1.874-2.787-3.61-2.787s-3.182,1.186-3.61,2.787c-.343-.177-.727-.287-1.14-.287-1.381,0-2.5,1.119-2.5,2.5s1.119,2.5,2.5,2.5H13.75c1.381,0,2.5-1.119,2.5-2.5s-1.119-2.5-2.5-2.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.585,12.499c.239-.413,.594-.752,1.02-.972"
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

export default moonCloud;

import React from 'react';

import type { iconProps } from './iconProps';

function usersDots(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users dots';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="7"
          cy="4.75"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.233,6.86c.24,.087,.497,.14,.767,.14,1.243,0,2.25-1.007,2.25-2.25s-1.007-2.25-2.25-2.25c-.27,0-.527,.052-.767,.14"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path d="M13,15c-.551,0-1-.448-1-1s.449-1,1-1,1,.448,1,1-.449,1-1,1Z" fill="currentColor" />
        <path d="M10,15c-.551,0-1-.448-1-1s.449-1,1-1,1,.448,1,1-.449,1-1,1Z" fill="currentColor" />
        <path
          d="M11.29,11.583c-1.007-1.264-2.548-2.083-4.29-2.083-2.145,0-4,1.229-4.906,3.02-.4,.791,.028,1.757,.866,2.048,1.031,.358,2.408,.683,4.04,.683,.191,0,.366-.018,.55-.026"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path d="M16,15c-.551,0-1-.448-1-1s.449-1,1-1,1,.448,1,1-.449,1-1,1Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default usersDots;

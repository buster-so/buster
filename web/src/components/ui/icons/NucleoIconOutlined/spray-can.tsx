import React from 'react';

import type { iconProps } from './iconProps';

function sprayCan(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px spray can';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.25 13.25L8.75 13.25 8.75 8.75 13.25 8.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75,4.75h3.5c1.656,0,3,1.344,3,3v7.5c0,.552-.448,1-1,1H4.75c-.552,0-1-.448-1-1V7.75c0-1.656,1.344-3,3-3Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75,4.75V1.75c0-.552,.448-1,1-1h1.5c.552,0,1,.448,1,1v3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="13.25" cy="2.75" fill="currentColor" r=".75" />
        <circle cx="15.75" cy="1.25" fill="currentColor" r=".75" />
        <circle cx="15.75" cy="4.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default sprayCan;

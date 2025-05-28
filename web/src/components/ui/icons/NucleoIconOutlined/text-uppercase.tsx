import React from 'react';

import type { iconProps } from './iconProps';

function textUppercase(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text uppercase';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.318 13.25L4.748 4.75 4.57 4.75 1 13.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.84 11.25L7.478 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.53,6.048c-.329-.433-1.169-1.298-2.625-1.298-2.136,0-3.655,1.522-3.655,4.304,0,2.444,1.492,4.196,3.439,4.196,1.125,0,3.266-.173,3.266-3.958h-3.158"
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

export default textUppercase;

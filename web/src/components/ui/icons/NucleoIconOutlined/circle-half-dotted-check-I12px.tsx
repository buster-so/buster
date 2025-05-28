import React from 'react';

import type { iconProps } from './iconProps';

function circleHalfDottedCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px circle half dotted check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m6,.75c2.899,0,5.25,2.351,5.25,5.25s-2.351,5.25-5.25,5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.747 6.5L5.25 8 8.253 4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="3.375" cy="1.453" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="1.453" cy="3.375" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx=".75" cy="6" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="1.453" cy="8.625" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="3.375" cy="10.547" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default circleHalfDottedCheck;

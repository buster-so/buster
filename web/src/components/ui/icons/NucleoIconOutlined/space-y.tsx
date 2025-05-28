import React from 'react';

import type { iconProps } from './iconProps';

function spaceY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px space y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="9" cy="5.875" fill="currentColor" r=".75" />
        <circle cx="9" cy="9" fill="currentColor" r=".75" />
        <circle cx="9" cy="12.125" fill="currentColor" r=".75" />
        <circle cx="9" cy="9" fill="currentColor" r=".75" />
        <path
          d="M15.25 2.75L2.75 2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25 15.25L2.75 15.25"
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

export default spaceY;

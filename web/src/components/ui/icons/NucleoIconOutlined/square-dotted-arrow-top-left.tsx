import React from 'react';

import type { iconProps } from './iconProps';

function squareDottedArrowTopLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square dotted arrow top left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="15.25" cy="9" fill="currentColor" r=".75" />
        <circle cx="9" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="12.125" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="5.875" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="2.75" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="12.125" fill="currentColor" r=".75" />
        <circle cx="5.875" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="12.125" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="12.125" cy="2.75" fill="currentColor" r=".75" />
        <path
          d="M8.75 2.75L8.75 8.75 2.75 8.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 8.75L2.75 2.75"
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

export default squareDottedArrowTopLeft;

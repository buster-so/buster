import React from 'react';

import type { iconProps } from './iconProps';

function borderCenterX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px border center x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 2.75L9 15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="2.75" cy="2.75" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="5.875" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="9" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="12.125" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="5.875" cy="9" fill="currentColor" r=".75" />
        <circle cx="12.125" cy="9" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="9" fill="currentColor" r=".75" />
        <circle cx="5.875" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="12.125" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="5.875" cy="2.75" fill="currentColor" r=".75" />
        <circle cx="12.125" cy="2.75" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="2.75" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="5.875" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="12.125" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default borderCenterX;

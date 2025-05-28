import React from 'react';

import type { iconProps } from './iconProps';

function restaurantMenu(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px restaurant menu';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="8" cy="5.5" fill="currentColor" r="1.5" />
        <path
          d="M3.25 2.75L12.75 1.75 12.75 16.25 3.25 15.25 3.25 2.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75 2.75L15.75 15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 9.25L10 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 12.25L10 12.5"
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

export default restaurantMenu;

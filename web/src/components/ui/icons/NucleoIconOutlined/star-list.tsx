import React from 'react';

import type { iconProps } from './iconProps';

function starList(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px star list';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 13.185L4.519 15.54 5.375 10.551 1.75 7.017 6.76 6.289 9 1.75 11.24 6.289 16.25 7.017 14.473 8.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11 14.75L16 14.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11 11.25L16 11.25"
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

export default starList;

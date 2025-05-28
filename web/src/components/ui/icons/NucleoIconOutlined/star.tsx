import React from 'react';

import type { iconProps } from './iconProps';

function star(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px star';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 1.75L11.24 6.289 16.25 7.017 12.625 10.551 13.481 15.54 9 13.185 4.519 15.54 5.375 10.551 1.75 7.017 6.76 6.289 9 1.75z"
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

export default star;

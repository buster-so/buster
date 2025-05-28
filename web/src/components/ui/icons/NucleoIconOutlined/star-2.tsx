import React from 'react';

import type { iconProps } from './iconProps';

function star2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px star 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 2L10.673 7.25 16.25 7.25 11.819 10.653 13.56 16 9 12.695 4.44 16 6.181 10.653 1.75 7.25 7.327 7.25 9 2z"
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

export default star2;

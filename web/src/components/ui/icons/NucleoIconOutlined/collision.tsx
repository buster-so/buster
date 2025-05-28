import React from 'react';

import type { iconProps } from './iconProps';

function collision(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px collision';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6 1L9.344 5.781 14 2 12.083 7.625 16.25 8.25 12.542 10.458 15.75 16.25 10 12.25 8 16.25 7 12 2 13 6 9 1.75 5.75 6.458 6.583 6 1z"
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

export default collision;

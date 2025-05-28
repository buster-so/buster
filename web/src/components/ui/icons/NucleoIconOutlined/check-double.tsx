import React from 'react';

import type { iconProps } from './iconProps';

function checkDouble(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px check double';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M0.75 9.5L4.5 14.25 12.5 4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.506 13.308L9.25 14.25 17.25 4"
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

export default checkDouble;

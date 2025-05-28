import React from 'react';

import type { iconProps } from './iconProps';

function connections(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px connections';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.875 3.125L3.125 8.875"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.125 3.125L8.875 8.875"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="8.132"
          width="8.132"
          fill="none"
          rx="1.246"
          ry="1.246"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(45 6 6)"
          x="1.934"
          y="1.934"
        />
      </g>
    </svg>
  );
}

export default connections;

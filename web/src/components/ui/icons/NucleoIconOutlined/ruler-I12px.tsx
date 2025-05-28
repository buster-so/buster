import React from 'react';

import type { iconProps } from './iconProps';

function ruler(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px ruler';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.623 6.623L7.754 7.754"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.873 4.373L9.504 6.004"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.373 7.873L6.004 9.504"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="4.96"
          width="11.161"
          fill="none"
          rx="1.086"
          ry="1.086"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-45 6 6)"
          x=".42"
          y="3.52"
        />
      </g>
    </svg>
  );
}

export default ruler;

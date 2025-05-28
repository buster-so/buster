import React from 'react';

import type { iconProps } from './iconProps';

function ballPool8(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ball pool 8';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <ellipse
          cx="9"
          cy="6.665"
          fill="none"
          rx="1.63"
          ry="1.415"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <ellipse
          cx="9"
          cy="9.665"
          fill="none"
          rx="1.868"
          ry="1.585"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default ballPool8;

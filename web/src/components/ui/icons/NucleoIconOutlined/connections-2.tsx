import React from 'react';

import type { iconProps } from './iconProps';

function connections2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px connections 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="4.596"
          width="4.596"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(45 7.25 5.75)"
          x="4.952"
          y="3.452"
        />
        <rect
          height="4.596"
          width="4.596"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-135 7.25 12.25)"
          x="4.952"
          y="9.952"
        />
        <rect
          height="4.596"
          width="4.596"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(135 14.414 9)"
          x="12.116"
          y="6.702"
        />
        <path
          d="M4.707,11.543c-.391,.391-1.024,.391-1.414,0l-1.836-1.836c-.391-.391-.391-1.024,0-1.414l1.836-1.836c.391-.391,1.024-.391,1.414,0"
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

export default connections2;

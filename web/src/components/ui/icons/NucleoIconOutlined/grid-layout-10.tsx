import React from 'react';

import type { iconProps } from './iconProps';

function gridLayout10(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grid layout 10';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="13.5"
          width="2.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 14.5 9)"
          x="13.25"
          y="2.25"
        />
        <rect
          height="2.5"
          width="8"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 6.25 9)"
          x="2.25"
          y="7.75"
        />
        <rect
          height="2.5"
          width="8"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 6.25 14.5)"
          x="2.25"
          y="13.25"
        />
        <rect
          height="2.5"
          width="8"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 6.25 3.5)"
          x="2.25"
          y="2.25"
        />
      </g>
    </svg>
  );
}

export default gridLayout10;

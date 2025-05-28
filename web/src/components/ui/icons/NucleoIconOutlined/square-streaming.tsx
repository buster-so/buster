import React from 'react';

import type { iconProps } from './iconProps';

function squareStreaming(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square streaming';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="12.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="2.75"
        />
        <path
          d="M10.798,6.47l-2.375-1.386c-.409-.239-.922,.056-.922,.53v2.771c0,.473,.514,.768,.922,.53l2.375-1.386c.406-.237,.406-.823,0-1.06Z"
          fill="currentColor"
        />
        <path
          d="M11.25 11.75L12.75 11.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25 11.75L8.75 11.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 13L8.75 10.5"
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

export default squareStreaming;

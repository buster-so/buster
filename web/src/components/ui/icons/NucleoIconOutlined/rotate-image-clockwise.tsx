import React from 'react';

import type { iconProps } from './iconProps';

function rotateImageClockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rotate image clockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="8.5"
          width="10.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="5.75"
          y="7.75"
        />
        <path d="M9,12c-.551,0-1-.449-1-1s.449-1,1-1,1,.449,1,1-.449,1-1,1Z" fill="currentColor" />
        <path
          d="M8.086,16.25l4.207-4.207c.391-.391,1.024-.391,1.414,0l2.519,2.519"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8,3.25h-2.75c-2.209,0-4,1.791-4,4v1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 1.25L8.25 3.25 6 5.25"
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

export default rotateImageClockwise;

import React from 'react';

import type { iconProps } from './iconProps';

function squareGrid3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square grid 3';

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
        <rect height="2" width="2" fill="currentColor" rx=".4" ry=".4" x="8" y="5" />
        <rect height="2" width="2" fill="currentColor" rx=".4" ry=".4" x="8" y="8" />
        <rect height="2" width="2" fill="currentColor" rx=".4" ry=".4" x="8" y="11" />
        <rect height="2" width="2" fill="currentColor" rx=".4" ry=".4" x="5" y="5" />
        <rect height="2" width="2" fill="currentColor" rx=".4" ry=".4" x="5" y="8" />
        <rect height="2" width="2" fill="currentColor" rx=".4" ry=".4" x="5" y="11" />
        <rect height="2" width="2" fill="currentColor" rx=".4" ry=".4" x="11" y="5" />
        <rect height="2" width="2" fill="currentColor" rx=".4" ry=".4" x="11" y="8" />
        <rect height="2" width="2" fill="currentColor" rx=".4" ry=".4" x="11" y="11" />
      </g>
    </svg>
  );
}

export default squareGrid3;

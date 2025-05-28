import React from 'react';

import type { iconProps } from './iconProps';

function shapeSquare(props: iconProps) {
  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="11"
          width="11"
          fill="currentColor"
          rx="2.75"
          ry="2.75"
          strokeWidth="0"
          x=".5"
          y=".5"
        />
      </g>
    </svg>
  );
}

export default shapeSquare;

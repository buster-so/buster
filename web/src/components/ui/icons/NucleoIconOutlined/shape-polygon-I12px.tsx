import React from 'react';

import type { iconProps } from './iconProps';

function shapePolygon(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px shape polygon';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m5.234,1.52l-3.524,2.83c-.374.3-.54.792-.424,1.26l1.049,4.209c.137.548.627.932,1.189.932h4.951c.562,0,1.053-.384,1.189-.932l1.049-4.209c.116-.467-.049-.959-.424-1.26l-3.524-2.83c-.448-.36-1.084-.36-1.532,0h0Z"
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

export default shapePolygon;

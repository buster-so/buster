import React from 'react';

import type { iconProps } from './iconProps';

function layoutFooter(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px layout footer';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75,13V4.75c0-1.105,.895-2,2-2H14.25c1.105,0,2,.895,2,2V13"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="4.5"
          width="14.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="10.75"
        />
      </g>
    </svg>
  );
}

export default layoutFooter;

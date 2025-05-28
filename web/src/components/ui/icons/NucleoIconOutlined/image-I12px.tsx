import React from 'react';

import type { iconProps } from './iconProps';

function image(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px image';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m2.32,10.516l4.723-4.723c.391-.391,1.024-.391,1.414,0l2.293,2.293"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="4" cy="4" fill="currentColor" r="1" strokeWidth="0" />
        <rect
          height="9.5"
          width="9.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.25"
          y="1.25"
        />
      </g>
    </svg>
  );
}

export default image;

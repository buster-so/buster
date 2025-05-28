import React from 'react';

import type { iconProps } from './iconProps';

function images2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px images 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.587,12.243l5.206-5.2c.391-.391,1.024-.391,1.414,0l3.043,3.043"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,6.75v6.5c0,1.105,.895,2,2,2H12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path d="M8,7c-.551,0-1-.449-1-1s.449-1,1-1,1,.449,1,1-.449,1-1,1Z" fill="currentColor" />
        <rect
          height="9.5"
          width="11.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 10.5 7.5)"
          x="4.75"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default images2;

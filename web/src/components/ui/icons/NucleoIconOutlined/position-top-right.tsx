import React from 'react';

import type { iconProps } from './iconProps';

function positionTopRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px position top right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="5.5"
          width="5.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 12.5 5.5)"
          x="9.75"
          y="2.75"
        />
        <path
          d="M2.75,3.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M2.75,6.625c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M2.75,9.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M2.75,12.875c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,12.875c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M2.75,16c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M5.875,16c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M5.875,3.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,16c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,16c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <circle cx="12.125" cy="15.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default positionTopRight;

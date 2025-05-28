import React from 'react';

import type { iconProps } from './iconProps';

function obj3dFront(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px obj 3d front';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 8.25L9 1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 3L9 0.75 11.25 3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m15.748,8.624v3.251c0,.262-.146.523-.413.664l-5.87,3.091c-.146.077-.306.116-.466.116s-.32-.038-.466-.116l-5.87-3.091c-.267-.141-.413-.402-.413-.664v-3.251"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.999 15.745L8.999 12.494"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6,6.2021l-3.348,1.7588c-.535.281-.535,1.0459,0,1.3271l5.883,3.0908c.293.1541.641.1541.934,0l5.883-3.0908c.535-.2812.535-1.0461,0-1.3271l-3.352-1.7617"
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

export default obj3dFront;

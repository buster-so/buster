import React from 'react';

import type { iconProps } from './iconProps';

function shieldHalved(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px shield halved';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6 0.75L6 11.214"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6,.75l4.25,1.75v4.969c0,2.201-3.185,3.449-4.041,3.745-.138.048-.281.048-.419,0-.855-.296-4.041-1.544-4.041-3.745V2.5L6,.75s0,0,0,0Z"
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

export default shieldHalved;

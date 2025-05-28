import React from 'react';

import type { iconProps } from './iconProps';

function pin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px pin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m10.185,4.744c0,1.899-2.482,4.948-3.624,6.25-.299.341-.825.341-1.123,0-1.141-1.301-3.624-4.351-3.624-6.25,0-2.527,2.163-3.994,4.185-3.994s4.185,1.467,4.185,3.994Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="5" fill="currentColor" r="1" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default pin;

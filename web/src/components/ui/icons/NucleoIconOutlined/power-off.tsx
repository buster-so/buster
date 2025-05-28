import React from 'react';

import type { iconProps } from './iconProps';

function powerOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px power off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.5,3.236c-1.946,1.184-3.25,3.319-3.25,5.764,0,3.728,3.022,6.75,6.75,6.75s6.75-3.022,6.75-6.75c0-2.445-1.304-4.579-3.25-5.764"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 1.75L9 8.25"
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

export default powerOff;

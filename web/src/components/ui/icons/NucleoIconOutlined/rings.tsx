import React from 'react';

import type { iconProps } from './iconProps';

function rings(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rings';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="6.25"
          cy="9"
          fill="none"
          r="5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.997,13.175c-1.354-.895-2.247-2.43-2.247-4.175,0-2.761,2.239-5,5-5s5,2.239,5,5c0,2.733-2.192,4.953-4.914,4.999"
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

export default rings;

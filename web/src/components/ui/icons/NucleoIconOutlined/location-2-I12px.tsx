import React from 'react';

import type { iconProps } from './iconProps';

function location2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px location 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="6"
          cy="3"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 5.25L6 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m3.5,7.97c-1.631.297-2.75.867-2.75,1.53,0,.966,2.351,1.75,5.25,1.75s5.25-.784,5.25-1.75c0-.663-1.119-1.233-2.75-1.53"
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

export default location2;

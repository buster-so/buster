import React from 'react';

import type { iconProps } from './iconProps';

function promotion(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px promotion';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.25,16.25l-5.25-3.5-5.25,3.5V3.75c0-1.105,.895-2,2-2h6.5c1.105,0,2,.895,2,2v12.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7 10.25L11 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="7" cy="6" fill="currentColor" r="1" />
        <circle cx="11" cy="10" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default promotion;

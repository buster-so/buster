import React from 'react';

import type { iconProps } from './iconProps';

function currencyRupee(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px currency rupee';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.25 5.75L12.75 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7,2.75c1.795,0,3.25,1.455,3.25,3.25s-1.455,3.25-3.25,3.25h-1.75l5,6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25 2.75L12.75 2.75"
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

export default currencyRupee;

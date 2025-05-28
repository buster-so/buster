import React from 'react';

import type { iconProps } from './iconProps';

function glass(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px glass';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.15 9.25L13.85 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.5,2.75H14.5l-1.07,10.699c-.102,1.022-.963,1.801-1.99,1.801H6.56c-1.028,0-1.888-.779-1.99-1.801L3.5,2.75Z"
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

export default glass;

import React from 'react';

import type { iconProps } from './iconProps';

function check2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px check 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75 9.5L6.5 13.25 15.25 4.5"
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

export default check2;

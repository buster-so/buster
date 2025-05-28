import React from 'react';

import type { iconProps } from './iconProps';

function compass(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px compass';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m8.665,3.688l-1.232,2.875c-.168.391-.479.703-.87.87l-2.875,1.232c-.223.096-.448-.13-.353-.353l1.232-2.875c.168-.391.479-.703.87-.87l2.875-1.232c.223-.096.448.13.353.353Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle
          cx="6"
          cy="6"
          fill="none"
          r="5.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default compass;

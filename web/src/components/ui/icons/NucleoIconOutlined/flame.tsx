import React from 'react';

import type { iconProps } from './iconProps';

function flame(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flame';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,16.25c1.519,0,2.75-1.235,2.75-2.759,0-2.096-2.75-4.491-2.75-4.491,0,0-2.75,2.396-2.75,4.491,0,1.524,1.231,2.759,2.75,2.759Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,16.25c3.038,0,5.5-2.47,5.5-5.517,0-4.191-5.5-8.983-5.5-8.983,0,0-5.5,4.792-5.5,8.983,0,3.047,2.462,5.517,5.5,5.517Z"
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

export default flame;

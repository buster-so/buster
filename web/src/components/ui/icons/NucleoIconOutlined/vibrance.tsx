import React from 'react';

import type { iconProps } from './iconProps';

function vibrance(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px vibrance';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.881,15.105L15.711,4.222c.357-.666-.126-1.472-.881-1.472H3.17c-.756,0-1.238,.806-.881,1.472l5.83,10.882c.377,.704,1.386,.704,1.763,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="7.75"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default vibrance;

import React from 'react';

import type { iconProps } from './iconProps';

function maskCircle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px mask circle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m.995,7.505c.48.144.978.245,1.505.245,2.899,0,5.25-2.351,5.25-5.25,0-.527-.101-1.025-.245-1.505"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
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

export default maskCircle;

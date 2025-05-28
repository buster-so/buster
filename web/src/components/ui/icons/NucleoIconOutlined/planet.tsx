import React from 'react';

import type { iconProps } from './iconProps';

function planet(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px planet';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="6.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6.75" cy="9.75" fill="currentColor" r=".75" />
        <circle cx="9.25" cy="6.75" fill="currentColor" r="1.25" />
        <path
          d="M13.948,2c.931-.332,1.646-.344,2.021,.031,1.1,1.1-1.129,5.111-4.978,8.96-3.849,3.849-7.861,6.078-8.96,4.978-.375-.375-.363-1.09-.031-2.021"
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

export default planet;

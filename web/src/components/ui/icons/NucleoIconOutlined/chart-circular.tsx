import React from 'react';

import type { iconProps } from './iconProps';

function chartCircular(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart circular';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,1.75c4.004,0,7.25,3.246,7.25,7.25s-3.246,7.25-7.25,7.25S1.75,13.004,1.75,9c0-1.478,.443-2.854,1.202-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,4.75c2.347,0,4.25,1.903,4.25,4.25s-1.903,4.25-4.25,4.25-4.25-1.903-4.25-4.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,7.75c.69,0,1.25,.56,1.25,1.25s-.56,1.25-1.25,1.25"
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

export default chartCircular;

import React from 'react';

import type { iconProps } from './iconProps';

function wip(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px wip';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9.25,4.7754v4.4746l-2.978,2.978c.7371.6296,1.6823,1.022,2.728,1.022,2.3436,0,4.25-1.9065,4.25-4.25,0-2.2581-1.7747-4.0923-4-4.2246Z"
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

export default wip;

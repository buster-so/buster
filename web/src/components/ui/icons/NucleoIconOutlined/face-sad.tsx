import React from 'react';

import type { iconProps } from './iconProps';

function faceSad(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face sad';

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
        <circle cx="7" cy="8" fill="currentColor" r="1" />
        <circle cx="11" cy="8" fill="currentColor" r="1" />
        <path
          d="M12,11.993c-.769-.768-1.83-1.243-3-1.243s-2.231,.475-3,1.243"
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

export default faceSad;

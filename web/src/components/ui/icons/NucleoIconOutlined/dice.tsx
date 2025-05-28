import React from 'react';

import type { iconProps } from './iconProps';

function dice(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dice';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="5" cy="12.5" fill="currentColor" r="1" />
        <circle cx="9.5" cy="8" fill="currentColor" r="1" />
        <circle cx="7.25" cy="10.25" fill="currentColor" r="1" />
        <rect
          height="11"
          width="11"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-180 7.25 10.25)"
          x="1.75"
          y="4.75"
        />
        <path
          d="M15.199,11.498l1.029-6.924c.162-1.093-.592-2.11-1.684-2.272L7.62,1.272c-.933-.139-1.81,.39-2.148,1.228"
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

export default dice;

import React from 'react';

import type { iconProps } from './iconProps';

function flipUpHelmet(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flip up helmet';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15,7.25h-6.788c-.703,0-1.187,.707-.932,1.362l.972,2.5c.149,.384,.52,.638,.932,.638h6.066"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,2.75h4.5c2.76,0,5,2.24,5,5v1.25c0,3.449-2.801,6.25-6.25,6.25h0c-3.449,0-6.25-2.801-6.25-6.25v-3.25c0-1.656,1.344-3,3-3Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 9 9)"
        />
      </g>
    </svg>
  );
}

export default flipUpHelmet;

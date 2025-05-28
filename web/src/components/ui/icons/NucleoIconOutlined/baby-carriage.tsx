import React from 'react';

import type { iconProps } from './iconProps';

function babyCarriage(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px baby carriage';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.75,7.75V1.75h0c3.038,0,5.5,2.462,5.5,5.5v.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,7.75H15.25v2c0,1.656-1.344,3-3,3H6.75c-1.656,0-3-1.344-3-3v-2h0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,4.75h.5c.828,0,1.5,.672,1.5,1.5v1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.25" cy="15.75" fill="currentColor" r="1.25" />
        <circle cx="13.75" cy="15.75" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default babyCarriage;

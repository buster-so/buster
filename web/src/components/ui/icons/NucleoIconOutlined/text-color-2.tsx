import React from 'react';

import type { iconProps } from './iconProps';

function textColor2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text color 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.5,16.25c1.519,0,2.75-1.235,2.75-2.759,0-2.095-1.542-2.991-2.75-4.491-1.208,1.5-2.75,2.396-2.75,4.491,0,1.524,1.231,2.759,2.75,2.759Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.615 8.457L8.401 2.75 7.599 2.75 2.75 15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.108 11.75L8.493 11.75"
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

export default textColor2;

import React from 'react';

import type { iconProps } from './iconProps';

function heading5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heading 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75 4.75L1.75 13.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 4.75L7.75 13.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 9L7.75 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.714,4.75h-4.746l-.317,3.86c1.691-1.025,3.759-1.069,4.891,.181,1.022,1.128,.868,2.697-.012,3.639s-3.515,1.491-5.029-.755"
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

export default heading5;

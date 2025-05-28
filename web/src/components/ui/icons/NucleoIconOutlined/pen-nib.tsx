import React from 'react';

import type { iconProps } from './iconProps';

function penNib(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pen nib';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 1.735L9 9.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.976,14.75l-2.242-4.868c-.145-.316-.116-.684,.077-.973L8.376,2.069c.297-.445,.951-.445,1.248,0l4.566,6.839c.193,.289,.222,.658,.077,.973l-2.242,4.868"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,16.25v-.5c0-.552,.448-1,1-1H13.25c.552,0,1,.448,1,1v.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="9.5"
          fill="currentColor"
          r=".75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default penNib;

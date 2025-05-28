import React from 'react';

import type { iconProps } from './iconProps';

function burger2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px burger 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="10.75" cy="5" fill="currentColor" r=".75" />
        <circle cx="7.25" cy="5.5" fill="currentColor" r=".75" />
        <path
          d="M15.352,7c-.365-1.395-1.574-4.25-5.352-4.25h-1c-.304,0-.637,0-1,0-3.778,0-4.987,2.855-5.352,4.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15,13.25s-.25,2-3.25,2c-.859,0-4.641,0-5.5,0-3,0-3.25-2-3.25-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path d="M9.5,9.25l1.61,2.012c.2,.25,.581,.25,.781,0l1.61-2.012h-4Z" fill="currentColor" />
        <rect
          height="3.5"
          width="14.5"
          fill="none"
          rx="1.75"
          ry="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="9.25"
        />
      </g>
    </svg>
  );
}

export default burger2;

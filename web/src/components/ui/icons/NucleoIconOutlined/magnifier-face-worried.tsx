import React from 'react';

import type { iconProps } from './iconProps';

function magnifierFaceWorried(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px magnifier face worried';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="7.75"
          cy="7.75"
          fill="none"
          r="5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.5" cy="7.25" fill="currentColor" r=".75" />
        <circle cx="10" cy="7.25" fill="currentColor" r=".75" />
        <path
          d="M15.25 15.25L11.285 11.285"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75,8h0c.828,0,1.5,.672,1.5,1.5h0c0,.276-.224,.5-.5,.5h-2c-.276,0-.5-.224-.5-.5h0c0-.828,.672-1.5,1.5-1.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default magnifierFaceWorried;

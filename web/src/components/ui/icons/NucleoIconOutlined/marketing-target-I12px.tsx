import React from 'react';

import type { iconProps } from './iconProps';

function marketingTarget(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px marketing target';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11 11L8.337 8.337"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m8.958,3.48c-.613-1.594-2.148-2.73-3.958-2.73C2.653.75.75,2.653.75,5c0,1.81,1.136,3.345,2.731,3.958"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m5.531,4.89l4.891,1.787c.447.163.434.801-.019.946l-2.106.674-.674,2.106c-.145.454-.782.467-.946.019l-1.787-4.891c-.146-.399.242-.787.641-.641Z"
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

export default marketingTarget;

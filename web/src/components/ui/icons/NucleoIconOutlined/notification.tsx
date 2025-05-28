import React from 'react';

import type { iconProps } from './iconProps';

function notification(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px notification';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.75,8.5v5.25c0,1.105-.895,2-2,2H4.25c-1.105,0-2-.895-2-2V5.25c0-1.105,.895-2,2-2h5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="14.5"
          cy="3.5"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default notification;

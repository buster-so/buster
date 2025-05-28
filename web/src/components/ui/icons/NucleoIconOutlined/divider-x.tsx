import React from 'react';

import type { iconProps } from './iconProps';

function dividerX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px divider x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m2.25,15.25h1.5c1.105,0,2-.895,2-2V4.75c0-1.105-.895-2-2-2h-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m15.75,15.25h-1.5c-1.105,0-2-.895-2-2V4.75c0-1.105.895-2,2-2h1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 2L9 16"
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

export default dividerX;

import React from 'react';

import type { iconProps } from './iconProps';

function squareCommand(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square command';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="12.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="2.75"
        />
        <path
          d="M7.75 7.75H10.25V10.25H7.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.5,5.25c-.69,0-1.25,.56-1.25,1.25s.56,1.25,1.25,1.25h1.25v-1.25c0-.69-.56-1.25-1.25-1.25Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,6.5c0-.69-.56-1.25-1.25-1.25s-1.25,.56-1.25,1.25v1.25h1.25c.69,0,1.25-.56,1.25-1.25Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.5,12.75c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25h-1.25v1.25c0,.69,.56,1.25,1.25,1.25Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25,11.5c0,.69,.56,1.25,1.25,1.25s1.25-.56,1.25-1.25v-1.25h-1.25c-.69,0-1.25,.56-1.25,1.25Z"
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

export default squareCommand;

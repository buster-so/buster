import React from 'react';

import type { iconProps } from './iconProps';

function fileTree(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px file tree';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.25,3.25v3.5c0,.552-.448,1-1,1h-2.5c-.552,0-1-.448-1-1V2.75c0-.552,.448-1,1-1h2l1.5,1.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 1.75L12.75 3.25 14.25 3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,11.75v3.5c0,.552-.448,1-1,1h-2.5c-.552,0-1-.448-1-1v-4c0-.552,.448-1,1-1h2l1.5,1.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 10.25L12.75 11.75 14.25 11.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25,4.75h-2c-.828,0-1.5-.672-1.5-1.5V1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25,13.25h-2c-.828,0-1.5-.672-1.5-1.5V3"
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

export default fileTree;

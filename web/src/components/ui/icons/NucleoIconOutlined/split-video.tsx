import React from 'react';

import type { iconProps } from './iconProps';

function splitVideo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px split video';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,13.25H2.75c-.552,0-1-.448-1-1v-2.5c0-.552,.448-1,1-1h6.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75,8.75h3.5c.552,0,1,.448,1,1v2.5c0,.552-.448,1-1,1h-3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,4.25l-1.75,2-1.75-2v-1.5c0-.552,.448-1,1-1h1.5c.552,0,1,.448,1,1v1.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 6.25L9 16.25"
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

export default splitVideo;

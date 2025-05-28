import React from 'react';

import type { iconProps } from './iconProps';

function video(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px video';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.25 3.75L8.75 6 11.25 8.25 11.25 3.75z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="3.25" cy="4.25" fill="currentColor" r=".75" strokeWidth="0" />
        <rect
          height="8.5"
          width="8"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x=".753"
          y="1.75"
        />
      </g>
    </svg>
  );
}

export default video;

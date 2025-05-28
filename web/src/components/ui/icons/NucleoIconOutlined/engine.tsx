import React from 'react';

import type { iconProps } from './iconProps';

function engine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px engine';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M17.25 8.75L17.25 13.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25,7.75h-1.5l-1.2-1.6c-.189-.252-.485-.4-.8-.4H5.75c-.315,0-.611,.148-.8,.4l-1.2,1.6h-1c-.552,0-1,.448-1,1v2.5c0,.552,.448,1,1,1h1l1.2,1.6c.189,.252,.485,.4,.8,.4h7.5c.552,0,1-.448,1-1v-4.5c0-.552-.448-1-1-1Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25 1.75L10.25 1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25 11L17.25 11"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 1.75L7.75 3.25"
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

export default engine;

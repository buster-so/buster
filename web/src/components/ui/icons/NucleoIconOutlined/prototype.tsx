import React from 'react';

import type { iconProps } from './iconProps';

function prototype(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px prototype';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.25,13.25v2c0,.552-.448,1-1,1H3.75c-.552,0-1-.448-1-1V2.75c0-.552,.448-1,1-1h5.5c.552,0,1,.448,1,1v2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75 11.5L17.25 9 14.75 6.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.25 9L12 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="10.25"
          cy="9"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default prototype;

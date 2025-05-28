import React from 'react';

import type { iconProps } from './iconProps';

function filter3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px filter 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.25 15.75L7.75 17.25 7.75 12.25 3.75 6.75 14.25 6.75 10.25 12.25 10.25 15.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path d="M9,2c.552,0,1-.449,1-1s-.448-1-1-1-1,.449-1,1,.448,1,1,1Z" fill="currentColor" />
        <path d="M5.5,2c.552,0,1-.449,1-1s-.448-1-1-1-1,.449-1,1,.448,1,1,1Z" fill="currentColor" />
        <path
          d="M12.5,2c.552,0,1-.449,1-1s-.448-1-1-1-1,.449-1,1,.448,1,1,1Z"
          fill="currentColor"
        />
        <path
          d="M10.75,4.5c.552,0,1-.449,1-1s-.448-1-1-1-1,.449-1,1,.448,1,1,1Z"
          fill="currentColor"
        />
        <path
          d="M7.25,4.5c.552,0,1-.449,1-1s-.448-1-1-1-1,.449-1,1,.448,1,1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default filter3;

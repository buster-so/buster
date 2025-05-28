import React from 'react';

import type { iconProps } from './iconProps';

function folderDots(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folder dots';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.25,8.75V4.75c0-1.105,.895-2,2-2h1.951c.607,0,1.18,.275,1.56,.748l.603,.752h5.386c1.105,0,2,.895,2,2v2.844"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path d="M14,16c-.551,0-1-.448-1-1s.449-1,1-1,1,.448,1,1-.449,1-1,1Z" fill="currentColor" />
        <path d="M11,16c-.551,0-1-.448-1-1s.449-1,1-1,1,.448,1,1-.449,1-1,1Z" fill="currentColor" />
        <path
          d="M15.75,12.56v-3.81c0-1.104-.895-2-2-2H4.25c-1.105,0-2,.896-2,2v4.5c0,1.104,.895,2,2,2h4.025"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path d="M17,16c-.551,0-1-.448-1-1s.449-1,1-1,1,.448,1,1-.449,1-1,1Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default folderDots;

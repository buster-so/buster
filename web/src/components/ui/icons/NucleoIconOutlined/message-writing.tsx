import React from 'react';

import type { iconProps } from './iconProps';

function messageWriting(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px message writing';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.25,2.25H3.75c-1.105,0-2,.896-2,2v7c0,1.104,.895,2,2,2h2v3l3.75-3h4.75c1.105,0,2-.896,2-2V4.25c0-1.104-.895-2-2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,8.75c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"
          fill="currentColor"
          opacity=".75"
        />
        <path
          d="M5.5,8.75c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
        <path
          d="M12.5,8.75c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"
          fill="currentColor"
          opacity=".5"
        />
      </g>
    </svg>
  );
}

export default messageWriting;

import React from 'react';

import type { iconProps } from './iconProps';

function deviceConnection(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px device connection';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,6v-.25c0-1.105,.895-2,2-2H14.25c1.105,0,2,.895,2,2v4.5c0,1.105-.895,2-2,2h-4.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.5,16c-.551,0-1-.449-1-1s.449-1,1-1,1,.449,1,1-.449,1-1,1Z"
          fill="currentColor"
        />
        <path
          d="M1.25,11.75h.25c1.795,0,3.25,1.455,3.25,3.25v.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.25,8.75h.25c3.452,0,6.25,2.798,6.25,6.25v.25"
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

export default deviceConnection;

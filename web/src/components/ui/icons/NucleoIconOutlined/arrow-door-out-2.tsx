import React from 'react';

import type { iconProps } from './iconProps';

function arrowDoorOut2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow door out 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.094,3l4.744,3.45c.259,.188,.412,.489,.412,.809v9.009c0,.409-.464,.645-.794,.404l-4.294-3.123c-.259-.188-.412-.489-.412-.809V3.75c0-.552,.448-1,1-1h6.5c.552,0,1,.448,1,1v2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.25,10.75v1.5c0,.552-.448,1-1,1h-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.5 11L16.25 8.25 13.5 5.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 8.25L10.25 8.25"
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

export default arrowDoorOut2;

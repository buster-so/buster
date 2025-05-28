import React from 'react';

import type { iconProps } from './iconProps';

function userAlien(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user alien';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.583,5h0c.23,0,.417,.187,.417,.417h0c0,1.15-.934,2.083-2.083,2.083h0c-.23,0-.417-.187-.417-.417h0c0-1.15,.934-2.083,2.083-2.083Z"
          fill="currentColor"
          transform="rotate(-180 10.75 6.25)"
        />
        <path
          d="M6.417,5h0c1.15,0,2.083,.934,2.083,2.083h0c0,.23-.187,.417-.417,.417h0c-1.15,0-2.083-.934-2.083-2.083h0c0-.23,.187-.417,.417-.417Z"
          fill="currentColor"
        />
        <path
          d="M4.75,6c0-2.347,1.903-4.25,4.25-4.25s4.25,1.903,4.25,4.25-2.844,4.75-4.25,4.75-4.25-2.403-4.25-4.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.953,16c1.298-1.958,3.522-3.25,6.047-3.25s4.749,1.291,6.047,3.25"
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

export default userAlien;

import React from 'react';

import type { iconProps } from './iconProps';

function linkBroken(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px link broken';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.5,6.827c-.352,.168-.682,.398-.973,.69l-.01,.01c-1.381,1.381-1.381,3.619,0,5l2.175,2.175c1.381,1.381,3.619,1.381,5,0l.01-.01c1.381-1.381,1.381-3.619,0-5l-.931-.931"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.5,11.173c.352-.168,.682-.398,.973-.69l.01-.01c1.381-1.381,1.381-3.619,0-5l-2.175-2.175c-1.381-1.381-3.619-1.381-5,0l-.01,.01c-1.381,1.381-1.381,3.619,0,5l.931,.931"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25 3.75L13 1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25 5.75L16.5 5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 12.25L1.5 13"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 14.25L5 16.5"
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

export default linkBroken;

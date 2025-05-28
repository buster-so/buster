import React from 'react';

import type { iconProps } from './iconProps';

function bookOpen2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px book open 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,4.75l5.984-1.651c.637-.176,1.266,.303,1.266,.964V12.489c0,.45-.3,.844-.734,.964l-6.516,1.797"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,15.25l-6.516-1.797c-.434-.12-.734-.514-.734-.964V4.063c0-.661,.629-1.14,1.266-.964l5.984,1.651V15.25Z"
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

export default bookOpen2;

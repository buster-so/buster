import React from 'react';

import type { iconProps } from './iconProps';

function faceDisappointed(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face disappointed';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12,11.993c-.769-.768-1.83-1.243-3-1.243s-2.231,.475-3,1.243"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.485,8c-.126,.119-.554,.496-1.228,.559-.636,.06-1.105-.195-1.258-.286"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.515,8c.126,.119,.554,.496,1.228,.559,.636,.06,1.105-.195,1.258-.286"
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

export default faceDisappointed;

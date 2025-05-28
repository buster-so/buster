import React from 'react';

import type { iconProps } from './iconProps';

function cards(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cards';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="10.5"
          width="8.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="1.75"
        />
        <path
          d="M13,5.258l2.283,.6c.534,.141,.853,.688,.712,1.222l-2.292,8.703c-.141,.534-.688,.853-1.222,.712l-6.491-1.71"
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

export default cards;

import React from 'react';

import type { iconProps } from './iconProps';

function coffee(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px coffee';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.75,4.75H13.25v6.5c0,1.104-.896,2-2,2H6.75c-1.104,0-2-.896-2-2V4.75h0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16 16.25L2 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25,4.75h2c.552,0,1,.448,1,1v1.5c0,1.105-.895,2-2,2h-1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7,2c.127-.04,.406-.146,.646-.417,.295-.333,.343-.706,.354-.833"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.25,2c.127-.04,.406-.146,.646-.417,.295-.333,.343-.706,.354-.833"
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

export default coffee;

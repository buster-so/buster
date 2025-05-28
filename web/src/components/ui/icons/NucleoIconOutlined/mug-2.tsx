import React from 'react';

import type { iconProps } from './iconProps';

function mug2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mug 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.033,7.25h1.717c.552,0,1,.448,1,1v1.5c0,1.105-.895,2-2,2h-1.109"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.841,4.75H13.159c.586,0,1.047,.502,.996,1.087l-.747,8.587c-.09,1.034-.955,1.827-1.992,1.827H6.584c-1.037,0-1.903-.793-1.992-1.827l-.747-8.587c-.051-.584,.41-1.087,.996-1.087Z"
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
        <circle
          cx="9"
          cy="10.5"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default mug2;

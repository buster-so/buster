import React from 'react';

import type { iconProps } from './iconProps';

function house5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75,15.75v-4.75c0-.69,.56-1.25,1.25-1.25h0c.69,0,1.25,.56,1.25,1.25v4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75 9.75L12.25 9.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.655,6.45L9,1.75l6.345,4.7c.255,.189,.405,.487,.405,.804v6.496c0,1.105-.895,2-2,2H4.25c-1.105,0-2-.895-2-2V7.254c0-.317,.15-.615,.405-.804Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 2.75L13.75 5.269"
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

export default house5;

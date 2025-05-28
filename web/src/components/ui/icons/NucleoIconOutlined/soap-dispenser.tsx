import React from 'react';

import type { iconProps } from './iconProps';

function soapDispenser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px soap dispenser';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.75 1.75L10.75 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25,5.75V2.75c0-.552,.448-1,1-1h6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25 12.75L8.75 12.75 8.75 9.25 13 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75,9.25c0-3.229,2.5-3.5,2.5-3.5h3.5s2.5,.25,2.5,3.5v5c0,1.105-.895,2-2,2H6.75c-1.105,0-2-.895-2-2v-5Z"
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

export default soapDispenser;

import React from 'react';

import type { iconProps } from './iconProps';

function ranking(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ranking';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.75,7.75h2.5c.552,0,1,.448,1,1v6.5H6.75v-6.5c0-.552,.448-1,1-1Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.25,11.75h3.5v3.5H3.25c-.552,0-1-.448-1-1v-1.5c0-.552,.448-1,1-1Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25,10.25h3.5c.552,0,1,.448,1,1v3c0,.552-.448,1-1,1h-3.5v-5h0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.25,4.75V.75s-.458,.806-1.431,.992"
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

export default ranking;

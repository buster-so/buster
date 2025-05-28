import React from 'react';

import type { iconProps } from './iconProps';

function print2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px print 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.25,5.25V2.75c0-.552,.448-1,1-1h5.5c.552,0,1,.448,1,1v2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25,13.25h-1c-1.105,0-2-.895-2-2V7.25c0-1.105,.895-2,2-2H13.75c1.105,0,2,.895,2,2v4c0,1.105-.895,2-2,2h-1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,8.75v6.5c0,.552-.448,1-1,1H6.25c-.552,0-1-.448-1-1v-6.5h7.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 13.75L10.25 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 11.25L10.25 11.25"
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

export default print2;

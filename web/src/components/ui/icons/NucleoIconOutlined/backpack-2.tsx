import React from 'react';

import type { iconProps } from './iconProps';

function backpack2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px backpack 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75,16.25H2.75c-.828,0-1.5-.672-1.5-1.5v-2c0-.299,.131-.567,.339-.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25,16.25h3c.828,0,1.5-.672,1.5-1.5v-2c0-.299-.131-.567-.339-.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75,4.25v-1.25c0-1.243,1.007-2.25,2.25-2.25h0c1.243,0,2.25,1.007,2.25,2.25v1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,11.25v3c0,1.105-.895,2-2,2H5.75c-1.105,0-2-.895-2-2v-3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75,4.25H15.25v5c0,1.104-.896,2-2,2H4.75c-1.104,0-2-.896-2-2V4.25h0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 12.75L6.75 9.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 12.75L11.25 9.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8 7.25L10 7.25"
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

export default backpack2;

import React from 'react';

import type { iconProps } from './iconProps';

function book(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px book';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,5.5h0c0-1.733,1.249-3.213,2.957-3.505L11.721,.903c.448-.081,.895,.15,1.086,.564"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,4.75V15.25c0,.552-.448,1-1,1H4.75c-1.105,0-2-.895-2-2V5.75c0-1.105,.895-2,2-2H14.25c.552,0,1,.448,1,1Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 3.75L5.75 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 7.75H12.25V10.25H8.75z"
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

export default book;

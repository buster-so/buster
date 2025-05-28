import React from 'react';

import type { iconProps } from './iconProps';

function fileDownload(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px file download';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m4.75,9.25l-2,2-2-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m2.75,11.25v-4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6.75,4.25h3.5c0-.321-.127-.627-.353-.853l-2.295-2.295c-.226-.226-.532-.353-.851-.353v3.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="M6.75 0.75L6.75 4.25 10.25 4.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6.285,11.25h1.965c1.105,0,2-.895,2-2v-5.001c0-.32-.127-.626-.353-.852l-2.294-2.294c-.226-.226-.532-.353-.852-.353h-3.001c-1.105,0-2,.895-2,2v1.461"
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

export default fileDownload;

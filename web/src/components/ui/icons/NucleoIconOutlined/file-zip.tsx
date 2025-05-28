import React from 'react';

import type { iconProps } from './iconProps';

function fileZip(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px file zip';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,14.25V3.75c0-1.105,.895-2,2-2h5.586c.265,0,.52,.105,.707,.293l3.914,3.914c.188,.188,.293,.442,.293,.707v7.586c0,1.105-.895,2-2,2H4.75c-1.105,0-2-.895-2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.16,6.25h-3.41c-.552,0-1-.448-1-1V1.852"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path d="M5 2.5H7V4H5z" fill="currentColor" />
        <path d="M7 4H9V5.5H7z" fill="currentColor" />
        <path d="M5 5.5H7V7H5z" fill="currentColor" />
        <path d="M7 7H9V8.5H7z" fill="currentColor" />
        <path
          d="M7,9.75h0c.69,0,1.25,.56,1.25,1.25v2.25h-2.5v-2.25c0-.69,.56-1.25,1.25-1.25Z"
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

export default fileZip;

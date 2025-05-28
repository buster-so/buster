import React from 'react';

import type { iconProps } from './iconProps';

function investment2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px investment 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,10.75V5.25c0-2.209-1.791-4-4-4h-1.25c-.025,1.512,.727,2.912,1.979,3.65,1.486,.876,3.014,.43,3.271,.35"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,7.27h0c0-2.209,1.791-4,4-4h1.25c.025,1.512-.727,2.912-1.979,3.65-1.486,.876-3.271,.35-3.271,.35Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.5,15.75h-.75c-.552,0-1-.448-1-1v-1c0-.552,.448-1,1-1h.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.5,15.75h.75c.552,0,1-.448,1-1v-1c0-.552-.448-1-1-1h-.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3"
          width="6.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="5.75"
          y="10.75"
        />
        <rect
          height="3"
          width="6.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="5.75"
          y="13.75"
        />
      </g>
    </svg>
  );
}

export default investment2;

import React from 'react';

import type { iconProps } from './iconProps';

function paperclipMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paperclip minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.25 4.25L11.25 4.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,5v6.75c0,.828,.672,1.5,1.5,1.5h0c.828,0,1.5-.672,1.5-1.5V4.75c0-1.657-1.343-3-3-3h0c-1.657,0-3,1.343-3,3v7c0,2.485,2.015,4.5,4.5,4.5h0c2.485,0,4.5-2.015,4.5-4.5V7.75"
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

export default paperclipMinus;

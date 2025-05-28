import React from 'react';

import type { iconProps } from './iconProps';

function webcam(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px webcam';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="7.5"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="7.5"
          fill="none"
          r="5.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.552,12.652l1.5,2.457c.305,.5-.054,1.141-.64,1.141H5.587c-.586,0-.945-.641-.64-1.141l1.501-2.456"
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

export default webcam;

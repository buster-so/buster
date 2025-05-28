import React from 'react';

import type { iconProps } from './iconProps';

function storage(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px storage';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <ellipse
          cx="9"
          cy="5.5"
          fill="none"
          rx="6.25"
          ry="3.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.193,9.442c-.415,1.586-3.029,2.808-6.193,2.808-3.163,0-5.778-1.222-6.193-2.808"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.193,12.942c-.415,1.586-3.029,2.808-6.193,2.808-3.163,0-5.778-1.222-6.193-2.808"
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

export default storage;

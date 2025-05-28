import React from 'react';

import type { iconProps } from './iconProps';

function upload(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px upload';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m8.5,5.75h.296c.96,0,1.785.682,1.965,1.626l.286,1.5c.235,1.232-.71,2.374-1.965,2.374h-3.082s-3.082,0-3.082,0c-1.255,0-2.199-1.142-1.965-2.374l.286-1.5c.18-.943,1.004-1.626,1.965-1.626h.296"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 1L6 8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25 3L6 0.75 3.75 3"
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

export default upload;

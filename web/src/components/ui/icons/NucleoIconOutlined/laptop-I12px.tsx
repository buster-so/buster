import React from 'react';

import type { iconProps } from './iconProps';

function laptop(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px laptop';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m3.25,9.75c-.828,0-1.5-.672-1.5-1.5V3.25c0-.828.672-1.5,1.5-1.5h5.5c.828,0,1.5.672,1.5,1.5v5c0,.828-.672,1.5-1.5,1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M0.75 9.75L11.25 9.75"
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

export default laptop;

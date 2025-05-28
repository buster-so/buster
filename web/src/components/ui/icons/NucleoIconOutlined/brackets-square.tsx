import React from 'react';

import type { iconProps } from './iconProps';

function bracketsSquare(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px brackets square';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12,15.25h2.25c.552,0,1-.448,1-1V3.75c0-.552-.448-1-1-1h-2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6,15.25H3.75c-.552,0-1-.448-1-1V3.75c0-.552,.448-1,1-1h2.25"
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

export default bracketsSquare;

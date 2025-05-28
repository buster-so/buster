import React from 'react';

import type { iconProps } from './iconProps';

function goalFlag(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px goal flag';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.75,6.25v5.5h-5c-.552,0-1,.448-1,1v2H3.75c-.552,0-1,.448-1,1v1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75,7.25l3-2.75L6.75,1.75h7c.552,0,1,.448,1,1v3.5c0,.552-.448,1-1,1H6.75Z"
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

export default goalFlag;

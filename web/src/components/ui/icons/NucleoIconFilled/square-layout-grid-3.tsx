import React from 'react';

import type { iconProps } from './iconProps';

function squareLayoutGrid3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square layout grid 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M9.75,6.5h6.25v-1.75c0-1.517-1.233-2.75-2.75-2.75h-3.5V6.5Z" fill="currentColor" />
        <path d="M8.25,10V2h-3.5c-1.517,0-2.75,1.233-2.75,2.75v5.25h6.25Z" fill="currentColor" />
        <path d="M8.25,11.5H2v1.75c0,1.517,1.233,2.75,2.75,2.75h3.5v-4.5Z" fill="currentColor" />
        <path d="M9.75,8v8h3.5c1.517,0,2.75-1.233,2.75-2.75v-5.25h-6.25Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default squareLayoutGrid3;

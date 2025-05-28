import React from 'react';

import type { iconProps } from './iconProps';

function squareLayoutGrid4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square layout grid 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16,6.5v-1.75c0-1.517-1.233-2.75-2.75-2.75H4.75c-1.517,0-2.75,1.233-2.75,2.75v1.75h14Z"
          fill="currentColor"
        />
        <path d="M8.25,8H2v5.25c0,1.517,1.233,2.75,2.75,2.75h3.5V8Z" fill="currentColor" />
        <path d="M9.75,8v8h3.5c1.517,0,2.75-1.233,2.75-2.75v-5.25h-6.25Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default squareLayoutGrid4;

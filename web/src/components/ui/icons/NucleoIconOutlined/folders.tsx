import React from 'react';

import type { iconProps } from './iconProps';

function folders(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folders';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.124,9.75h3.626c.828,0,1.5,.672,1.5,1.5v3.5c0,.828-.672,1.5-1.5,1.5H7.25c-.828,0-1.5-.672-1.5-1.5v-5.5c0-.828,.672-1.5,1.5-1.5h1.351c.415,0,.811,.172,1.095,.475l1.429,1.525Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.25,10.25h0c-.828,0-1.5-.672-1.5-1.5V3.25c0-.828,.672-1.5,1.5-1.5h1.351c.415,0,.811,.172,1.095,.475l1.429,1.525h3.626c.828,0,1.5,.672,1.5,1.5v2"
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

export default folders;

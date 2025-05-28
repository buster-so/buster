import React from 'react';

import type { iconProps } from './iconProps';

function copies4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px copies 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.25,17H3.75c-1.517,0-2.75-1.233-2.75-2.75v-3.5c0-1.517,1.233-2.75,2.75-2.75h1.5v1.5h-1.5c-.689,0-1.25,.561-1.25,1.25v3.5c0,.689,.561,1.25,1.25,1.25h3.5c.689,0,1.25-.561,1.25-1.25v-1.5h1.5v1.5c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
        />
        <path
          d="M10.75,13.5h-3.5c-1.517,0-2.75-1.233-2.75-2.75v-3.5c0-1.517,1.233-2.75,2.75-2.75h1.5v1.5h-1.5c-.689,0-1.25,.561-1.25,1.25v3.5c0,.689,.561,1.25,1.25,1.25h3.5c.689,0,1.25-.561,1.25-1.25v-1.5h1.5v1.5c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
        />
        <rect height="9" width="9" fill="currentColor" rx="2.75" ry="2.75" x="8" y="1" />
      </g>
    </svg>
  );
}

export default copies4;

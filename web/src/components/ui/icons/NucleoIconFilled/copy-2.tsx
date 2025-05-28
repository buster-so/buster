import React from 'react';

import type { iconProps } from './iconProps';

function copy2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px copy 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.75,13h-1c-1.517,0-2.75-1.233-2.75-2.75V4.75c0-1.517,1.233-2.75,2.75-2.75h7.5c1.517,0,2.75,1.233,2.75,2.75v1h-1.5v-1c0-.689-.561-1.25-1.25-1.25H3.75c-.689,0-1.25,.561-1.25,1.25v5.5c0,.689,.561,1.25,1.25,1.25h1v1.5Z"
          fill="currentColor"
        />
        <rect height="11" width="13" fill="currentColor" rx="2.75" ry="2.75" x="4" y="5" />
      </g>
    </svg>
  );
}

export default copy2;

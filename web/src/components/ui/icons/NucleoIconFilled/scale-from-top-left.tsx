import React from 'react';

import type { iconProps } from './iconProps';

function scaleFromTopLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px scale from top left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m3.25,1.25h2.75v3c0,.966-.784,1.75-1.75,1.75H1.25v-2.75c0-1.105.895-2,2-2Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.5,3.25v5.5c0,1.517-1.233,2.75-2.75,2.75H3.25c-1.517,0-2.75-1.233-2.75-2.75V3.25C.5,1.733,1.733.5,3.25.5h5.5c1.517,0,2.75,1.233,2.75,2.75Zm-2.75,6.75c.689,0,1.25-.561,1.25-1.25V3.25c0-.689-.561-1.25-1.25-1.25H3.25c-.689,0-1.25.561-1.25,1.25v5.5c0,.689.561,1.25,1.25,1.25h5.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default scaleFromTopLeft;

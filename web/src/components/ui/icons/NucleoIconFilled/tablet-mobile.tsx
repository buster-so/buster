import React from 'react';

import type { iconProps } from './iconProps';

function tabletMobile(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px tablet mobile';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m4.25,10h-1c-1.517,0-2.75-1.233-2.75-2.75V2.75C.5,1.233,1.733,0,3.25,0h2.75c1.517,0,2.75,1.233,2.75,2.75,0,.414-.336.75-.75.75s-.75-.336-.75-.75c0-.689-.561-1.25-1.25-1.25h-2.75c-.689,0-1.25.561-1.25,1.25v4.5c0,.689.561,1.25,1.25,1.25h1c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect
          height="7.5"
          width="5.5"
          fill="currentColor"
          rx="2.25"
          ry="2.25"
          strokeWidth="0"
          x="6"
          y="4.5"
        />
      </g>
    </svg>
  );
}

export default tabletMobile;

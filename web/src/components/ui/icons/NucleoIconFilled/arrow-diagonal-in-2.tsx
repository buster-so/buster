import React from 'react';

import type { iconProps } from './iconProps';

function arrowDiagonalIn2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow diagonal in 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.78,10.72l-3.72-3.72h2.189c.414,0,.75-.336.75-.75s-.336-.75-.75-.75h-4c-.414,0-.75.336-.75.75v4c0,.414.336.75.75.75s.75-.336.75-.75v-2.189l3.72,3.72c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m3.75,11h-1c-1.517,0-2.75-1.233-2.75-2.75V2.75C0,1.233,1.233,0,2.75,0h5.5c1.517,0,2.75,1.233,2.75,2.75v1c0,.414-.336.75-.75.75s-.75-.336-.75-.75v-1c0-.689-.561-1.25-1.25-1.25H2.75c-.689,0-1.25.561-1.25,1.25v5.5c0,.689.561,1.25,1.25,1.25h1c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowDiagonalIn2;

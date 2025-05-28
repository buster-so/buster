import React from 'react';

import type { iconProps } from './iconProps';

function shareUpLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px share up left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.75,11.5H3.25c-1.517,0-2.75-1.233-2.75-2.75v-1.25c0-.414.336-.75.75-.75s.75.336.75.75v1.25c0,.689.561,1.25,1.25,1.25h5.5c.689,0,1.25-.561,1.25-1.25V3.25c0-.689-.561-1.25-1.25-1.25h-1.25c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h1.25c1.517,0,2.75,1.233,2.75,2.75v5.5c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m5,.5H1.25c-.414,0-.75.336-.75.75v3.75c0,.414.336.75.75.75s.75-.336.75-.75v-1.939l2.202,2.202c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061l-2.202-2.202h1.939c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default shareUpLeft;

import React from 'react';

import type { iconProps } from './iconProps';

function arrowsReduceDiagonal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrows reduce diagonal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.018,3.982h-1.939l2.202-2.202c.293-.293.293-.768,0-1.061s-.768-.293-1.061,0l-2.202,2.202V.982c0-.414-.336-.75-.75-.75s-.75.336-.75.75v3.75c0,.414.336.75.75.75h3.75c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.732,6.518H.982c-.414,0-.75.336-.75.75s.336.75.75.75h1.939l-2.202,2.202c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22l2.202-2.202v1.939c0,.414.336.75.75.75s.75-.336.75-.75v-3.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowsReduceDiagonal;

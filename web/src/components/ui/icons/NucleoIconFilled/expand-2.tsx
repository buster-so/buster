import React from 'react';

import type { iconProps } from './iconProps';

function expand2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px expand 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m1.25,5c-.414,0-.75-.336-.75-.75v-1C.5,1.733,1.733.5,3.25.5h1c.414,0,.75.336.75.75s-.336.75-.75.75h-1c-.689,0-1.25.561-1.25,1.25v1c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.75,11.5h-1c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h1c.689,0,1.25-.561,1.25-1.25v-1c0-.414.336-.75.75-.75s.75.336.75.75v1c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75.5h-3.75c-.414,0-.75.336-.75.75s.336.75.75.75h1.939l-2.202,2.202c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22l2.202-2.202v1.939c0,.414.336.75.75.75s.75-.336.75-.75V1.25c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m5,10h-1.939l2.202-2.202c.293-.293.293-.768,0-1.061s-.768-.293-1.061,0l-2.202,2.202v-1.939c0-.414-.336-.75-.75-.75s-.75.336-.75.75v3.75c0,.414.336.75.75.75h3.75c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default expand2;

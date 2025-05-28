import React from 'react';

import type { iconProps } from './iconProps';

function arrowsCross(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrows cross';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m4.232,4.982c-.192,0-.384-.073-.53-.22L.72,1.78c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.982,2.982c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75,6.5c-.414,0-.75.336-.75.75v1.689l-1.702-1.702c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l1.702,1.702h-1.689c-.414,0-.75.336-.75.75s.336.75.75.75h3.5c.414,0,.75-.336.75-.75v-3.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75.5h-3.5c-.414,0-.75.336-.75.75s.336.75.75.75h1.689L.72,10.22c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22L10,3.061v1.689c0,.414.336.75.75.75s.75-.336.75-.75V1.25c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowsCross;

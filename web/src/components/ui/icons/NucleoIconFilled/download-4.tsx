import React from 'react';

import type { iconProps } from './iconProps';

function download4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px download 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.78,4.97c-.293-.293-.768-.293-1.061,0l-.97.97V1.75c0-.414-.336-.75-.75-.75s-.75.336-.75.75v4.189l-.97-.97c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l2.25,2.25c.146.146.338.22.53.22s.384-.073.53-.22l2.25-2.25c.293-.293.293-.768,0-1.061Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.75,11.5H3.25c-1.517,0-2.75-1.233-2.75-2.75v-1c0-.414.336-.75.75-.75s.75.336.75.75v1c0,.689.561,1.25,1.25,1.25h5.5c.689,0,1.25-.561,1.25-1.25v-1c0-.414.336-.75.75-.75s.75.336.75.75v1c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default download4;

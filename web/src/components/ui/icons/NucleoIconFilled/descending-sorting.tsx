import React from 'react';

import type { iconProps } from './iconProps';

function descendingSorting(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px descending sorting';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.78,8.22c-.293-.293-.768-.293-1.061,0l-1.22,1.22v-5.439c0-.414-.336-.75-.75-.75s-.75.336-.75.75v5.439l-1.22-1.22c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l2.5,2.5c.146.146.338.22.53.22s.384-.073.53-.22l2.5-2.5c.293-.293.293-.768,0-1.061Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11,2H1c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h10c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m3.75,5.5H1c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2.75c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m3.75,9H1c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2.75c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default descendingSorting;

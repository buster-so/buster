import React from 'react';

import type { iconProps } from './iconProps';

function arrowsReduceX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrows reduce x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m2.53,2.72c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l1.47,1.47H.75c-.414,0-.75.336-.75.75s.336.75.75.75h2.189l-1.47,1.47c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22l2.75-2.75c.293-.293.293-.768,0-1.061l-2.75-2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.25,5.25h-2.189l1.47-1.47c.293-.293.293-.768,0-1.061s-.768-.293-1.061,0l-2.75,2.75c-.293.293-.293.768,0,1.061l2.75,2.75c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061l-1.47-1.47h2.189c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowsReduceX;

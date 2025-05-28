import React from 'react';

import type { iconProps } from './iconProps';

function align2DistributeVertical(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px align 2 distribute vertical';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.25,1.5H.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h10.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.25,12H.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h10.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect
          height="6"
          width="9"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="1.5"
          y="3"
        />
      </g>
    </svg>
  );
}

export default align2DistributeVertical;

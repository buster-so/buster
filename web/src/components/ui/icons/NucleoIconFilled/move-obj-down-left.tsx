import React from 'react';

import type { iconProps } from './iconProps';

function moveObjDownLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px move obj down left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m4.452,6.487l-2.952,2.952v-1.939c0-.414-.336-.75-.75-.75s-.75.336-.75.75v3.75c0,.414.336.75.75.75h3.75c.414,0,.75-.336.75-.75s-.336-.75-.75-.75h-1.939l2.952-2.952c.293-.293.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" strokeWidth="0" x="6" />
      </g>
    </svg>
  );
}

export default moveObjDownLeft;

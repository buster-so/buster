import React from 'react';

import type { iconProps } from './iconProps';

function rectCenterX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px rect center x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m.75,11.75c-.414,0-.75-.336-.75-.75V1C0,.586.336.25.75.25s.75.336.75.75v10c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.25,11.75c-.414,0-.75-.336-.75-.75V1c0-.414.336-.75.75-.75s.75.336.75.75v10c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect
          height="6"
          width="6"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="3"
          y="3"
        />
      </g>
    </svg>
  );
}

export default rectCenterX;

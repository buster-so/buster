import React from 'react';

import type { iconProps } from './iconProps';

function ballotRect(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px ballot rect';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.25,4h-5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.25,9.5h-5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect height="4" width="4" fill="currentColor" rx="1" ry="1" strokeWidth="0" y="1" />
        <rect height="4" width="4" fill="currentColor" rx="1" ry="1" strokeWidth="0" y="7" />
      </g>
    </svg>
  );
}

export default ballotRect;

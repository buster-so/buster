import React from 'react';

import type { iconProps } from './iconProps';

function maskCircle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px mask circle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,0C2.691,0,0,2.691,0,6s2.691,6,6,6,6-2.691,6-6S9.309,0,6,0Zm0,1.5c.3,0,.593.032.877.089.074.322.123.626.123.911,0,2.481-2.019,4.5-4.5,4.5-.285,0-.588-.049-.911-.124-.056-.284-.089-.576-.089-.876C1.5,3.519,3.519,1.5,6,1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default maskCircle;

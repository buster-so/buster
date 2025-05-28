import React from 'react';

import type { iconProps } from './iconProps';

function arrowToCornerBottomRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow to corner bottom right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.75,11.5H2.5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h6.25c.689,0,1.25-.561,1.25-1.25V2.5c0-.414.336-.75.75-.75s.75.336.75.75v6.25c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m7.25,2.25c-.414,0-.75.336-.75.75v2.439L1.78.72c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l4.72,4.72h-2.439c-.414,0-.75.336-.75.75s.336.75.75.75h4.25c.414,0,.75-.336.75-.75V3c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowToCornerBottomRight;

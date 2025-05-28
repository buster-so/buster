import React from 'react';

import type { iconProps } from './iconProps';

function crop(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px crop';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9.25,12c-.414,0-.75-.336-.75-.75V3.75c0-.138-.112-.25-.25-.25h-3c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h3c.965,0,1.75.785,1.75,1.75v7.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m2.75,3.5H.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.25,10H3.75c-.965,0-1.75-.785-1.75-1.75V.75c0-.414.336-.75.75-.75s.75.336.75.75v7.5c0,.138.112.25.25.25h7.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default crop;

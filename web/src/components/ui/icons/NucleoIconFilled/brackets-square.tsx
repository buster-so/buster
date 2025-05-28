import React from 'react';

import type { iconProps } from './iconProps';

function bracketsSquare(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px brackets square';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.75,11.5h-2.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2V2h-2c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2.75c.414,0,.75.336.75.75v9.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4,11.5H1.25c-.414,0-.75-.336-.75-.75V1.25c0-.414.336-.75.75-.75h2.75c.414,0,.75.336.75.75s-.336.75-.75.75h-2v8h2c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default bracketsSquare;

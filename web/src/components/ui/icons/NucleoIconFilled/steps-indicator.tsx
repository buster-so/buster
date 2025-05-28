import React from 'react';

import type { iconProps } from './iconProps';

function stepsIndicator(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px steps indicator';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m4,6.75H.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h3.25c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.25,6.75h-3.25c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h3.25c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6,3c-1.655,0-3,1.346-3,3s1.345,3,3,3,3-1.346,3-3-1.345-3-3-3Zm0,4c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default stepsIndicator;

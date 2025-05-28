import React from 'react';

import type { iconProps } from './iconProps';

function stack(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px stack';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="1em"
          width="8.5"
          fill="currentColor"
          rx="2.25"
          ry="2.25"
          strokeWidth="0"
          x=".5"
        />
        <path
          d="m11.25,10c-.414,0-.75-.336-.75-.75V2.75c0-.414.336-.75.75-.75s.75.336.75.75v6.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default stack;

import React from 'react';

import type { iconProps } from './iconProps';

function barsFilter(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px bars filter';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.25,3.5H.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h10.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.25,7H2.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h6.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m7.25,10.5h-2.5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default barsFilter;

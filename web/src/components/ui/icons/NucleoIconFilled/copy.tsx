import React from 'react';

import type { iconProps } from './iconProps';

function copy(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px copy';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.25,12H2.25c-1.24,0-2.25-1.009-2.25-2.25V3.75c0-.414.336-.75.75-.75s.75.336.75.75v6c0,.414.337.75.75.75h6c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect
          height="9.5"
          width="9.5"
          fill="currentColor"
          rx="2.25"
          ry="2.25"
          strokeWidth="0"
          x="2.5"
        />
      </g>
    </svg>
  );
}

export default copy;

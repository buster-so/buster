import React from 'react';

import type { iconProps } from './iconProps';

function chartColumn(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chart column';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m4.25,8.5c-.414,0-.75-.336-.75-.75V3.75c0-.414.336-.75.75-.75s.75.336.75.75v4c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.25,8.5c-.414,0-.75-.336-.75-.75V1.75c0-.414.336-.75.75-.75s.75.336.75.75v6c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m7.25,8.5c-.414,0-.75-.336-.75-.75v-1.5c0-.414.336-.75.75-.75s.75.336.75.75v1.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75,11.5H3.25c-1.517,0-2.75-1.233-2.75-2.75V1.25c0-.414.336-.75.75-.75s.75.336.75.75v7.5c0,.689.561,1.25,1.25,1.25h7.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default chartColumn;

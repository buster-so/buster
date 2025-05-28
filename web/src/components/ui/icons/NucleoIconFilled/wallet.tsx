import React from 'react';

import type { iconProps } from './iconProps';

function wallet(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px wallet';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m.75,3c-.414,0-.75-.336-.75-.75C0,1.009,1.01,0,2.25,0h5c.414,0,.75.336.75.75s-.336.75-.75.75H2.25c-.413,0-.75.336-.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.25,3H2.25c-.413,0-.75-.336-.75-.75s-.336-.75-.75-.75-.75.336-.75.75v6c0,1.517,1.233,2.75,2.75,2.75h7.5c.965,0,1.75-.785,1.75-1.75v-4.5c0-.965-.785-1.75-1.75-1.75Zm-2.25,5c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default wallet;

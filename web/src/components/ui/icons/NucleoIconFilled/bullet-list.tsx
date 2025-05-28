import React from 'react';

import type { iconProps } from './iconProps';

function bulletList(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px bullet list';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.75,3h-5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75,6h-5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75,9h-5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75,12h-5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle cx="2.25" cy="2.25" fill="currentColor" r="1.75" strokeWidth="0" />
        <circle cx="2.25" cy="8.25" fill="currentColor" r="1.75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default bulletList;

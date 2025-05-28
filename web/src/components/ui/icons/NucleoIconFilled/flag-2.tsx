import React from 'react';

import type { iconProps } from './iconProps';

function flag2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px flag 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9.75,1H3v7h6.75c.689,0,1.25-.561,1.25-1.25V2.25c0-.689-.561-1.25-1.25-1.25Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m2.75,12c-.414,0-.75-.336-.75-.75V.75c0-.414.336-.75.75-.75s.75.336.75.75v10.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default flag2;

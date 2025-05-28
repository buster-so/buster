import React from 'react';

import type { iconProps } from './iconProps';

function alertInfo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px alert info';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9,16c-.4141,0-.75-.3359-.75-.75V6.75c0-.4141.3359-.75.75-.75s.75.3359.75.75v8.5c0,.4141-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9,2c-.551,0-1,.449-1,1s.449,1,1,1,1-.449,1-1-.449-1-1-1Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default alertInfo;

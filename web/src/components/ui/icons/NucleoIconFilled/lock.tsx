import React from 'react';

import type { iconProps } from './iconProps';

function lock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px lock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.25,6c-.414,0-.75-.336-.75-.75v-2.25c0-.827-.673-1.5-1.5-1.5s-1.5.673-1.5,1.5v2.25c0,.414-.336.75-.75.75s-.75-.336-.75-.75v-2.25c0-1.654,1.346-3,3-3s3,1.346,3,3v2.25c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.25,4.5H2.75c-1.241,0-2.25,1.009-2.25,2.25v3c0,1.241,1.009,2.25,2.25,2.25h6.5c1.241,0,2.25-1.009,2.25-2.25v-3c0-1.241-1.009-2.25-2.25-2.25Zm-2.5,4.25c0,.414-.336.75-.75.75s-.75-.336-.75-.75v-1c0-.414.336-.75.75-.75s.75.336.75.75v1Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default lock;

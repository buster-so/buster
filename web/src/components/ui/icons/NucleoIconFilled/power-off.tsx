import React from 'react';

import type { iconProps } from './iconProps';

function powerOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px power off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,12c-3.309,0-6-2.691-6-6,0-1.762.771-3.428,2.113-4.572.316-.268.789-.229,1.058.085.269.315.23.789-.085,1.058-1.008.857-1.586,2.107-1.586,3.429,0,2.481,2.019,4.5,4.5,4.5s4.5-2.019,4.5-4.5c0-1.322-.578-2.571-1.585-3.429-.315-.269-.354-.742-.085-1.057.27-.315.742-.353,1.057-.085,1.343,1.143,2.114,2.809,2.114,4.571,0,3.309-2.691,6-6,6Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6,6.75c-.414,0-.75-.336-.75-.75V.75c0-.414.336-.75.75-.75s.75.336.75.75v5.25c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default powerOff;

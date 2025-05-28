import React from 'react';

import type { iconProps } from './iconProps';

function expandObj2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px expand obj 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="6"
          width="6"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="3"
          y="3"
        />
        <path
          d="m10.75,5c-.414,0-.75-.336-.75-.75v-2.25h-2.25c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2.25c.827,0,1.5.673,1.5,1.5v2.25c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.25,11.5h-2.25c-.827,0-1.5-.673-1.5-1.5v-2.25c0-.414.336-.75.75-.75s.75.336.75.75v2.25h2.25c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default expandObj2;

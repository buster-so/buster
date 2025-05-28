import React from 'react';

import type { iconProps } from './iconProps';

function followObjUpLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px follow obj up left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.561,7.5h1.939c.414,0,.75-.336.75-.75s-.336-.75-.75-.75h-3.75c-.414,0-.75.336-.75.75v3.75c0,.414.336.75.75.75s.75-.336.75-.75v-1.939l2.952,2.952c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061l-2.952-2.952Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" strokeWidth="0" y="0" />
      </g>
    </svg>
  );
}

export default followObjUpLeft;

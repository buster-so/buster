import React from 'react';

import type { iconProps } from './iconProps';

function circleAsterisk(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px circle asterisk';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,0C2.691,0,0,2.691,0,6s2.691,6,6,6,6-2.691,6-6S9.309,0,6,0Zm.75,6.851v1.649c0,.414-.336.75-.75.75s-.75-.336-.75-.75v-1.649c-.732-.298-1.25-1.014-1.25-1.851,0-1.103.897-2,2-2s2,.897,2,2c0,.837-.518,1.554-1.25,1.851Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default circleAsterisk;

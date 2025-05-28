import React from 'react';

import type { iconProps } from './iconProps';

function circleWarning(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px circle warning';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,0C2.691,0,0,2.691,0,6s2.691,6,6,6,6-2.691,6-6S9.309,0,6,0Zm-.75,3.5c0-.414.336-.75.75-.75s.75.336.75.75v3c0,.414-.336.75-.75.75s-.75-.336-.75-.75v-3Zm.75,6.25c-.482,0-.875-.393-.875-.875s.393-.875.875-.875.875.393.875.875-.393.875-.875.875Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default circleWarning;

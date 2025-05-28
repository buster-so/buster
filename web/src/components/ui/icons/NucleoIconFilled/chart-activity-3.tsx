import React from 'react';

import type { iconProps } from './iconProps';

function chartActivity3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chart activity 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m7.625,11.5c-1.31,0-2.375-1.065-2.375-2.375V2.875c0-.482-.393-.875-.875-.875s-.875.393-.875.875v1.875c0,1.241-1.009,2.25-2.25,2.25h-.5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h.5c.414,0,.75-.336.75-.75v-1.875c0-1.31,1.065-2.375,2.375-2.375s2.375,1.065,2.375,2.375v6.25c0,.482.393.875.875.875s.875-.393.875-.875v-1.875c0-1.241,1.009-2.25,2.25-2.25h.5c.414,0,.75.336.75.75s-.336.75-.75.75h-.5c-.414,0-.75.336-.75.75v1.875c0,1.31-1.065,2.375-2.375,2.375Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default chartActivity3;

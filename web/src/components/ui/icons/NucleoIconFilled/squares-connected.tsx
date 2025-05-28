import React from 'react';

import type { iconProps } from './iconProps';

function squaresConnected(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px squares connected';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" x="1.5" y="1.5" />
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" x="10.5" y="10.5" />
        <path
          d="M13,6.25v2c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2c0-1.517-1.233-2.75-2.75-2.75h-2c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2c.689,0,1.25,.561,1.25,1.25Z"
          fill="currentColor"
        />
        <path
          d="M8.25,13h-2c-.689,0-1.25-.561-1.25-1.25v-2c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2c0,1.517,1.233,2.75,2.75,2.75h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squaresConnected;

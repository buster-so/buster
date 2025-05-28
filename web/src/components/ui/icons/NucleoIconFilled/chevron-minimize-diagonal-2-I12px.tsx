import React from 'react';

import type { iconProps } from './iconProps';

function chevronMinimizeDiagonal2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chevron minimize diagonal 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.75,9.5h-4.5c-.414,0-.75,.336-.75,.75v4.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.75h3.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M7.75,2.5c-.414,0-.75,.336-.75,.75v3.75H3.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H7.75c.414,0,.75-.336,.75-.75V3.25c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chevronMinimizeDiagonal2;

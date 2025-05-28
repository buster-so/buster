import React from 'react';

import type { iconProps } from './iconProps';

function arrowsExpandDiagonal4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrows expand diagonal 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.25 0.161H9.75V17.839000000000002H8.25z"
          fill="currentColor"
          transform="rotate(-45 9 9)"
        />
        <path
          d="M2.75,8c-.414,0-.75-.336-.75-.75V2.75c0-.414,.336-.75,.75-.75H7.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H3.5v3.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,16h-4.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.75v-3.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowsExpandDiagonal4;

import React from 'react';

import type { iconProps } from './iconProps';

function arrowsExpandDiagonal6(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrows expand diagonal 6';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M8.25 0.868H9.75V17.131H8.25z" fill="currentColor" transform="rotate(-45 9 9)" />
        <path
          d="M14.75,15.5h-6.01c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.26v-5.26c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.01c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M3.25,10.01c-.414,0-.75-.336-.75-.75V3.25c0-.414,.336-.75,.75-.75h6.01c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H4v5.26c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowsExpandDiagonal6;

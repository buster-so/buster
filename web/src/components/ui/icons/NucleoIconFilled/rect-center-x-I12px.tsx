import React from 'react';

import type { iconProps } from './iconProps';

function rectCenterX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rect center x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,2c-.414,0-.75,.336-.75,.75V15.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,2c-.414,0-.75,.336-.75,.75V15.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <rect height="8" width="8" fill="currentColor" rx="1.75" ry="1.75" x="5" y="5" />
      </g>
    </svg>
  );
}

export default rectCenterX;

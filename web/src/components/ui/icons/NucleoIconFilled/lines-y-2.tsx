import React from 'react';

import type { iconProps } from './iconProps';

function linesY2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px lines y 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,14c-.414,0-.75-.336-.75-.75V7.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v5.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,14c-.414,0-.75-.336-.75-.75V4.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V13.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M7,16c-.414,0-.75-.336-.75-.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V15.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11,11c-.414,0-.75-.336-.75-.75v-2.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11,15c-.414,0-.75-.336-.75-.75v-1c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default linesY2;

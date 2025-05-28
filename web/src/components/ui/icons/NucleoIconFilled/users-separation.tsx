import React from 'react';

import type { iconProps } from './iconProps';

function usersSeparation(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users separation';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1.25c-.414,0-.75,.336-.75,.75v14c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M4,8.5c-1.654,0-3,1.346-3,3v2.25c0,.965,.785,1.75,1.75,1.75h2.5c.965,0,1.75-.785,1.75-1.75v-2.25c0-1.654-1.346-3-3-3Z"
          fill="currentColor"
        />
        <path
          d="M14,8.5c-1.654,0-3,1.346-3,3v2.25c0,.965,.785,1.75,1.75,1.75h2.5c.965,0,1.75-.785,1.75-1.75v-2.25c0-1.654-1.346-3-3-3Z"
          fill="currentColor"
        />
        <circle cx="4" cy="5.25" fill="currentColor" r="2.25" />
        <circle cx="14" cy="5.25" fill="currentColor" r="2.25" />
      </g>
    </svg>
  );
}

export default usersSeparation;

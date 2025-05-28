import React from 'react';

import type { iconProps } from './iconProps';

function dumbbell(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dumbbell';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,9.75H1c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H17c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M4,2.5c-1.103,0-2,.897-2,2V13.5c0,1.103,.897,2,2,2s2-.897,2-2V4.5c0-1.103-.897-2-2-2Z"
          fill="currentColor"
        />
        <path
          d="M14,2.5c-1.103,0-2,.897-2,2V13.5c0,1.103,.897,2,2,2s2-.897,2-2V4.5c0-1.103-.897-2-2-2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default dumbbell;

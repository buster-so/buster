import React from 'react';

import type { iconProps } from './iconProps';

function mediaPrevious(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px media previous';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.205,3.042c-.502-.297-1.107-.305-1.618-.022L5.333,7.59c-.514,.285-.833,.825-.833,1.41s.319,1.125,.833,1.41l8.254,4.57c.249,.138,.52,.207,.791,.206,.285,0,.57-.076,.828-.228,.498-.293,.795-.812,.795-1.387V4.43c0-.575-.297-1.094-.795-1.387Z"
          fill="currentColor"
        />
        <path
          d="M2.75,2c-.414,0-.75,.336-.75,.75V15.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default mediaPrevious;

import React from 'react';

import type { iconProps } from './iconProps';

function strokeRoundCap(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stroke round cap';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11,15H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H11c2.481,0,4.5-2.019,4.5-4.5s-2.019-4.5-4.5-4.5H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H11c3.309,0,6,2.691,6,6s-2.691,6-6,6Z"
          fill="currentColor"
        />
        <path
          d="M11,6c-1.394,0-2.558,.96-2.893,2.25H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6.357c.335,1.29,1.5,2.25,2.893,2.25,1.654,0,3-1.346,3-3s-1.346-3-3-3Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default strokeRoundCap;

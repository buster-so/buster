import React from 'react';

import type { iconProps } from './iconProps';

function moveObjDownRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px move obj down right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,9.99c-.414,0-.75,.336-.75,.75v2.7l-3.72-3.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l3.72,3.72h-2.7c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.51c.414,0,.75-.336,.75-.75v-4.51c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <rect height="7" width="7" fill="currentColor" rx="1.75" ry="1.75" x="2" y="2" />
      </g>
    </svg>
  );
}

export default moveObjDownRight;

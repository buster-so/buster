import React from 'react';

import type { iconProps } from './iconProps';

function moveObjDownLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px move obj down left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.22,9.72l-3.72,3.72v-2.7c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v4.51c0,.414,.336,.75,.75,.75H7.26c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.7l3.72-3.72c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
        <rect height="7" width="7" fill="currentColor" rx="1.75" ry="1.75" x="9" y="2" />
      </g>
    </svg>
  );
}

export default moveObjDownLeft;

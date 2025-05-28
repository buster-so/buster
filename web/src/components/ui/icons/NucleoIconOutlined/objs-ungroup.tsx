import React from 'react';

import type { iconProps } from './iconProps';

function objsUngroup(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px objs ungroup';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="7.5"
          width="7.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="2.75"
        />
        <path
          d="M12.75,7.75h1.5c.552,0,1,.448,1,1v5.5c0,.552-.448,1-1,1h-5.5c-.552,0-1-.448-1-1v-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default objsUngroup;

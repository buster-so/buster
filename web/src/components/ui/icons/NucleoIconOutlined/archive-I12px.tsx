import React from 'react';

import type { iconProps } from './iconProps';

function archive(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px archive';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m10.75,6.25h-3v1c0,.276-.224.5-.5.5h-2.5c-.276,0-.5-.224-.5-.5v-1H1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="9.5"
          width="9.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.25"
          y="1.25"
        />
      </g>
    </svg>
  );
}

export default archive;

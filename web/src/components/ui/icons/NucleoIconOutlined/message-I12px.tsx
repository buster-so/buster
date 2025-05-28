import React from 'react';

import type { iconProps } from './iconProps';

function message(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px message';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m9.25,8.75h-2.5l-3,2.5v-2.5h-1c-1.105,0-2-.895-2-2v-3.5c0-1.105.895-2,2-2h6.5c1.105,0,2,.895,2,2v3.5c0,1.105-.895,2-2,2Z"
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

export default message;

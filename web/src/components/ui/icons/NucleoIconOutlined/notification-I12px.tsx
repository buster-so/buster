import React from 'react';

import type { iconProps } from './iconProps';

function notification(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px notification';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m6.801,1.25h-3.551c-1.105,0-2,.895-2,2v5.5c0,1.105.895,2,2,2h5.5c1.105,0,2-.895,2-2v-3.551"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="10.25" cy="1.75" fill="currentColor" r="1.75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default notification;

import React from 'react';

import type { iconProps } from './iconProps';

function cloudDroplet(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud droplet';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,16.25c1.036,0,1.875-.852,1.875-1.903,0-1.445-1.051-2.063-1.875-3.097-.824,1.034-1.875,1.652-1.875,3.097,0,1.051,.839,1.903,1.875,1.903Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.464,14.125c1.604-.425,2.786-1.887,2.786-3.625s-1.185-3.182-2.786-3.609c-.186-2.314-2.102-4.141-4.464-4.141-2.485,0-4.5,2.015-4.5,4.5,0,.35,.049,.686,.124,1.013-1.597,.067-2.874,1.374-2.874,2.987,0,1.553,1.18,2.831,2.693,2.985"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.705,8c.687-.767,1.684-1.25,2.795-1.25,.333,0,.657,.059,.964,.141"
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

export default cloudDroplet;

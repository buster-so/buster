import React from 'react';

import type { iconProps } from './iconProps';

function butterfly(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px butterfly';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m5.3824,4.0205c-.9364-.4922-2.0022-.7705-3.1324-.7705v3.5c0,2.208,1.792,4,4,4h0c-1.45,0-2.5,1.175-2.5,2.625s1.175,2.625,2.625,2.625,2.625-1.175,2.625-2.625v-.375"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m12.6176,4.0205c.9364-.4922,2.0022-.7705,3.1324-.7705v3.5c0,2.208-1.792,4-4,4h0c1.45,0,2.5,1.175,2.5,2.625s-1.175,2.625-2.625,2.625-2.625-1.175-2.625-2.625v-.375"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9,13V5c0-1.875-2-3-2-3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9,5c0-1.875-2-3-2-3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9,5c0-1.875,2-3,2-3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.5" cy="7" fill="currentColor" r="1" strokeWidth="0" />
        <circle cx="12.5" cy="7" fill="currentColor" r="1" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default butterfly;

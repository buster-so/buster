import React from 'react';

import type { iconProps } from './iconProps';

function lipstick(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px lipstick';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.25,7.75V3.29c0-.179,.096-.345,.252-.434l2.5-1.429c.333-.19,.748,.05,.748,.434V7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,10.75v-2c0-.552,.448-1,1-1h4.5c.552,0,1,.448,1,1v2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,10.75h6.5c.552,0,1,.448,1,1v2.5c0,1.104-.896,2-2,2H6.75c-1.104,0-2-.896-2-2v-2.5c0-.552,.448-1,1-1Z"
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

export default lipstick;

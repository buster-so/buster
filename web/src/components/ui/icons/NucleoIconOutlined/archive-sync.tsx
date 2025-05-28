import React from 'react';

import type { iconProps } from './iconProps';

function archiveSync(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px archive sync';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m11.25,10.25v1c0,.552-.448,1-1,1h-2.5c-.552,0-1-.448-1-1v-1H2.75v3c0,1.104.895,2,2,2h8.5c1.105,0,2-.896,2-2v-3h-4Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 3.75L16.25 3.75 16.25 1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m8.5726,2.75h-3.8226c-1.105,0-2,.896-2,2v5.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m15.5003,6.3871c-.5014.5313-1.2121.8629-2.0003.8629-1.5188,0-2.75-1.2312-2.75-2.75s1.2312-2.75,2.75-2.75c1.166,0,2.1625.7256,2.5625,1.7499"
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

export default archiveSync;

import React from 'react';

import type { iconProps } from './iconProps';

function windshieldCleaner(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px windshield cleaner';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.25,4c0-1.174-.951-2.125-2.125-2.125s-2.125,.951-2.125,2.125"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.5,6.871c-1.889,.177-3.5,.527-4.75,.879v7.5c1.771-.498,4.256-1,7.25-1,1.839,0,4.368,.189,7.25,1V7.75c-1.738-.489-3.343-.749-4.75-.881"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,10V4c0-1.174-.951-2.125-2.125-2.125s-2.125,.951-2.125,2.125"
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

export default windshieldCleaner;

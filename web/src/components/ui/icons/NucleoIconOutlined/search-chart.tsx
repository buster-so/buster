import React from 'react';

import type { iconProps } from './iconProps';

function searchChart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px search chart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.25 15.25L11.285 11.285"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.418,5.956l-2.988,2.987c-.134,.134-.353,.134-.488,0l-2.386-2.386c-.134-.134-.353-.134-.488,0l-2.988,2.986"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.45,9.459c-.698,1.92-2.539,3.291-4.7,3.291-2.761,0-5-2.239-5-5S4.989,2.75,7.75,2.75c2.13,0,3.948,1.331,4.669,3.206"
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

export default searchChart;

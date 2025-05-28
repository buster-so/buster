import React from 'react';

import type { iconProps } from './iconProps';

function userShortHairShirt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user short hair shirt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="6.5"
          fill="none"
          r="3.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.27,6.301c.473,.126,.967,.199,1.48,.199,2.048,0,3.841-1.074,4.86-2.686-.675-.656-1.594-1.064-2.61-1.064-2.003,0-3.624,1.574-3.73,3.551Z"
          fill="currentColor"
        />
        <path
          d="M2.953,16c1.298-1.958,3.522-3.25,6.047-3.25s4.749,1.291,6.047,3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.447,16.105l1.536-3.072c-.631-.179-1.294-.283-1.983-.283s-1.352,.104-1.983,.283l1.536,3.072c.184,.369,.71,.369,.894,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userShortHairShirt;

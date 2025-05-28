import React from 'react';

import type { iconProps } from './iconProps';

function boxShield(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px box shield';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 2.25L9 8.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3,6.284l1.449-2.922c.338-.681,1.032-1.112,1.792-1.112h5.518c.76,0,1.454,.431,1.792,1.112l1.449,2.923"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,8.345v-1.095c0-1.104-.895-2-2-2H4.75c-1.105,0-2,.896-2,2v6c0,1.104,.895,2,2,2h4.536"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.5,10.75l2.75,1.25v2.94c0,1.54-2.75,2.31-2.75,2.31,0,0-2.75-.77-2.75-2.31v-2.94l2.75-1.25Z"
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

export default boxShield;

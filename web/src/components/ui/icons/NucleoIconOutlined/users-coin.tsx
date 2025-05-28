import React from 'react';

import type { iconProps } from './iconProps';

function usersCoin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users coin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="5.25"
          cy="3.25"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="12.75"
          cy="3.25"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="13.75"
          fill="none"
          r="3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.642,12.382c-.604-.089-1.138-.219-1.591-.356-.489-.148-.818-.635-.709-1.135,.393-1.797,1.993-3.142,3.908-3.142,.818,0,1.579,.246,2.213,.667"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.358,12.382c.604-.089,1.138-.219,1.591-.356,.489-.148,.818-.635,.709-1.135-.393-1.797-1.993-3.142-3.908-3.142-.818,0-1.579,.246-2.213,.667"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 13L9 14.5"
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

export default usersCoin;

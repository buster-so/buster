import React from 'react';

import type { iconProps } from './iconProps';

function windowKey(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px window key';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="4.25" cy="5.25" fill="currentColor" r=".75" />
        <circle cx="6.75" cy="5.25" fill="currentColor" r=".75" />
        <circle
          cx="11"
          cy="14.25"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 7.75L16.25 7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,11.75V4.75c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2V13.25c0,1.104,.895,2,2,2h3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 14.25L17.25 14.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75 14.25L15.75 15.75"
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

export default windowKey;

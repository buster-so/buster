import React from 'react';

import type { iconProps } from './iconProps';

function windowChartLine2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px window chart line 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="4.25" cy="5.25" fill="currentColor" r=".75" />
        <circle cx="6.75" cy="5.25" fill="currentColor" r=".75" />
        <path
          d="M1.75 7.75L16.25 7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,8.71v-3.96c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2V13.25c0,1.104,.895,2,2,2h3.428"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 17.25L10.5 15.25 11.5 16.5 13.5 13 15 15.5 17.25 11"
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

export default windowChartLine2;

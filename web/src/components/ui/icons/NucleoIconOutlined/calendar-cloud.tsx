import React from 'react';

import type { iconProps } from './iconProps';

function calendarCloud(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px calendar cloud';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75 2.75L5.75 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25 2.75L12.25 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25 6.25L15.75 6.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,9.594V4.75c0-1.104-.895-2-2-2H4.25c-1.105,0-2,.896-2,2V13.25c0,1.104,.895,2,2,2h3.038"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14,11.75c-1.131,0-2.058,.837-2.217,1.925-.196-.108-.418-.175-.658-.175-.759,0-1.375,.616-1.375,1.375s.616,1.375,1.375,1.375h2.875c1.243,0,2.25-1.007,2.25-2.25s-1.007-2.25-2.25-2.25Z"
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

export default calendarCloud;

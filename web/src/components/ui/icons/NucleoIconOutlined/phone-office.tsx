import React from 'react';

import type { iconProps } from './iconProps';

function phoneOffice(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px phone office';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.25,3.25H15.25c.552,0,1,.448,1,1V13.25c0,.552-.448,1-1,1H6.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 5.75H13.75V6.75H8.75z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75,14.25v1c0,1.105-.895,2-2,2h0c-1.105,0-2-.895-2-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="13.5"
          width="4.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="1.75"
        />
        <circle cx="8.75" cy="9.25" fill="currentColor" r=".75" />
        <circle cx="11.25" cy="9.25" fill="currentColor" r=".75" />
        <circle cx="13.75" cy="9.25" fill="currentColor" r=".75" />
        <circle cx="8.75" cy="11.75" fill="currentColor" r=".75" />
        <circle cx="11.25" cy="11.75" fill="currentColor" r=".75" />
        <circle cx="13.75" cy="11.75" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default phoneOffice;

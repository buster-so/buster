import React from 'react';

import type { iconProps } from './iconProps';

function calculator(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px calculator';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="14.5"
          width="10.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="3.75"
          y="1.75"
        />
        <circle cx="6.25" cy="11" fill="currentColor" r=".75" />
        <circle cx="6.25" cy="8.25" fill="currentColor" r=".75" />
        <circle cx="9" cy="8.25" fill="currentColor" r=".75" />
        <circle cx="11.75" cy="8.25" fill="currentColor" r=".75" />
        <circle cx="9" cy="11" fill="currentColor" r=".75" />
        <circle cx="6.25" cy="13.75" fill="currentColor" r=".75" />
        <circle cx="9" cy="13.75" fill="currentColor" r=".75" />
        <path
          d="M6.25 4.25H11.75V5.25H6.25z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75 11L11.75 13.75"
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

export default calculator;

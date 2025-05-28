import React from 'react';

import type { iconProps } from './iconProps';

function circles5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circles 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="4.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="3.25" cy="3.25" fill="currentColor" r="1.25" />
        <circle cx="14.75" cy="3.25" fill="currentColor" r="1.25" />
        <circle cx="3.25" cy="14.75" fill="currentColor" r="1.25" />
        <circle cx="14.75" cy="14.75" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default circles5;

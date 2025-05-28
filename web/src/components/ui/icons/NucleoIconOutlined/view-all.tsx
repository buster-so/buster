import React from 'react';

import type { iconProps } from './iconProps';

function viewAll(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px view all';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="5.5"
          width="7"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="2.75"
        />
        <rect
          height="8.5"
          width="4"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="12.25"
          y="4.75"
        />
        <rect
          height="4"
          width="5.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="3.75"
          y="11.25"
        />
      </g>
    </svg>
  );
}

export default viewAll;

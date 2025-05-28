import React from 'react';

import type { iconProps } from './iconProps';

function tableCols2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px table cols 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6 1.25L6 10.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="9.5"
          width="9.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.25"
          y="1.25"
        />
      </g>
    </svg>
  );
}

export default tableCols2;

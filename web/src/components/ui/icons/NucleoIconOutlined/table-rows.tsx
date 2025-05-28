import React from 'react';

import type { iconProps } from './iconProps';

function tableRows(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table rows';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.25 9L2.75 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="12.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 9 9)"
          x="2.75"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default tableRows;

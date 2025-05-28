import React from 'react';

import type { iconProps } from './iconProps';

function dice4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dice 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
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
          x="2.75"
          y="2.75"
        />
        <circle cx="11" cy="7" fill="currentColor" r="1" />
        <circle cx="7" cy="7" fill="currentColor" r="1" />
        <circle cx="11" cy="11" fill="currentColor" r="1" />
        <circle cx="7" cy="11" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default dice4;

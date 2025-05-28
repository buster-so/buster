import React from 'react';

import type { iconProps } from './iconProps';

function minus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.25 9L14.75 9"
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

export default minus;

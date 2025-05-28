import React from 'react';

import type { iconProps } from './iconProps';

function check(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.76,7.004l2.25,3L10.24,1.746"
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

export default check;

import React from 'react';

import type { iconProps } from './iconProps';

function cloud(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px cloud';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m8.75,4.25c-.243,0-.473.046-.695.11-.485-1.51-1.884-2.61-3.555-2.61C2.429,1.75.75,3.429.75,5.5s1.679,3.75,3.75,3.75h4.25c1.381,0,2.5-1.119,2.5-2.5s-1.119-2.5-2.5-2.5Z"
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

export default cloud;

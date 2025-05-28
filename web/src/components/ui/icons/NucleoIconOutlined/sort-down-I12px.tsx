import React from 'react';

import type { iconProps } from './iconProps';

function sortDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px sort down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m6.4,10.717l2-2.667c.247-.33.012-.8-.4-.8h-4c-.412,0-.647.47-.4.8l2,2.667c.2.267.6.267.8,0Z"
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

export default sortDown;

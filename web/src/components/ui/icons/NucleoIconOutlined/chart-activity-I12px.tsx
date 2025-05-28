import React from 'react';

import type { iconProps } from './iconProps';

function chartActivity(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chart activity';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M0.75 9.75L3 6.75 4 9.25 7 3.75 8.25 8.25 11.25 2.25"
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

export default chartActivity;

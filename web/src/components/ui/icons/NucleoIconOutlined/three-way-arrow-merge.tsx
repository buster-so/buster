import React from 'react';

import type { iconProps } from './iconProps';

function threeWayArrowMerge(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px three way arrow merge';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 1.75L9 15.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.5,14.25l4.914-4.914c.375-.375,.586-.884,.586-1.414"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.5,14.25l-4.914-4.914c-.375-.375-.586-.884-.586-1.414"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25 5L9 1.75 5.75 5"
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

export default threeWayArrowMerge;

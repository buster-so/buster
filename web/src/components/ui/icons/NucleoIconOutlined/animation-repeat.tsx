import React from 'react';

import type { iconProps } from './iconProps';

function animationRepeat(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px animation repeat';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="8.5"
          width="8.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="7.75"
          y="1.75"
        />
        <path
          d="M12.25,13.25H6.75c-1.105,0-2-.895-2-2V5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.25,16.25H3.75c-1.105,0-2-.895-2-2v-5.5"
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

export default animationRepeat;

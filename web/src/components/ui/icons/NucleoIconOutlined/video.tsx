import React from 'react';

import type { iconProps } from './iconProps';

function video(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px video';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.25,8l4.259-2.342c.333-.183,.741,.058,.741,.438v5.809c0,.38-.408,.621-.741,.438l-4.259-2.342"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="10.5"
          width="10.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="3.75"
        />
        <circle cx="4.75" cy="6.75" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default video;

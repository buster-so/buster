import React from 'react';

import type { iconProps } from './iconProps';

function augmentedReality(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px augmented reality';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m8.398.912l-2.55,1.479c-.37.215-.598.61-.598,1.038v2.968c0,.428.228.823.598,1.038l2.55,1.479c.372.216.832.216,1.204,0l2.55-1.479c.37-.215.598-.61.598-1.038v-2.968c0-.428-.228-.823-.598-1.038l-2.55-1.479c-.372-.216-.832-.216-1.204,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.59 2.831L9 4.913 5.41 2.831"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 9.076L9 4.913"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.9385,14.025l1.5903-2.5653c.2735-.4412.7558-.7096,1.2749-.7096h.9463"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m16.0615,14.025l-1.5903-2.5653c-.2735-.4412-.7558-.7096-1.2749-.7096h-.9463"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3"
          width="14.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="13.25"
        />
      </g>
    </svg>
  );
}

export default augmentedReality;

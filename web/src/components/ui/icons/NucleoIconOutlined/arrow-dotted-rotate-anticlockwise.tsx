import React from 'react';

import type { iconProps } from './iconProps';

function arrowDottedRotateAnticlockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow dotted rotate anticlockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.872 3.305L2.28 6.25 5.224 5.843"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.232,8.484c-.265-3.763-3.401-6.734-7.232-6.734-3.031,0-5.627,1.86-6.71,4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="14.127" cy="14.127" fill="currentColor" r=".75" />
        <circle cx="9" cy="16.25" fill="currentColor" r=".75" />
        <circle cx="3.873" cy="14.127" fill="currentColor" r=".75" />
        <circle cx="1.75" cy="9" fill="currentColor" r=".75" />
        <circle cx="15.698" cy="11.774" fill="currentColor" r=".75" />
        <circle cx="11.774" cy="15.698" fill="currentColor" r=".75" />
        <circle cx="6.226" cy="15.698" fill="currentColor" r=".75" />
        <circle cx="2.302" cy="11.774" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default arrowDottedRotateAnticlockwise;

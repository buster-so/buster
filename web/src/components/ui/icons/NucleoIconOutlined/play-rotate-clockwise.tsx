import React from 'react';

import type { iconProps } from './iconProps';

function playRotateClockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px play rotate clockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m11.652,8.568l-3.651-2.129c-.333-.194-.752.046-.752.432v4.259c0,.386.419.626.752.432l3.651-2.129c.331-.193.331-.671,0-.864h0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.75,9C1.75,4.996,4.996,1.75,9,1.75s7.25,3.246,7.25,7.25-3.246,7.25-7.25,7.25c-3.031,0-5.627-1.86-6.71-4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.88 14.695L2.288 11.75 5.232 12.157"
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

export default playRotateClockwise;

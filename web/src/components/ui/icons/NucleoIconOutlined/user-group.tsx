import React from 'react';

import type { iconProps } from './iconProps';

function userGroup(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user group';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="4.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="13.75"
          cy="2.75"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="4.25"
          cy="2.75"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.323,11.499l-.852-2.413c-.282-.8-1.036-1.335-1.885-1.334-.381,0-.793,0-1.174,0-.848,0-1.602,.535-1.884,1.334l-.851,2.413c-.096,.272,.057,.568,.334,.647l1.239,.354,.195,3.309c.031,.529,.469,.941,.998,.941h1.114c.529,0,.967-.413,.998-.941l.195-3.309,1.239-.354c.277-.079,.43-.375,.334-.647Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.193,15.25h1.114c.529,0,.967-.413,.998-.941l.195-3.309,1.239-.354c.277-.079,.43-.375,.334-.647l-.852-2.413c-.282-.8-1.036-1.335-1.885-1.334-.381,0-.793,0-1.174,0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.807,15.25h-1.114c-.529,0-.967-.413-.998-.941l-.195-3.309-1.239-.354c-.277-.079-.43-.375-.334-.647l.852-2.413c.282-.8,1.036-1.335,1.885-1.334,.381,0,.793,0,1.174,0"
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

export default userGroup;

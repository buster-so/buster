import React from 'react';

import type { iconProps } from './iconProps';

function coupon(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px coupon';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="10"
          cy="15.25"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="4"
          cy="12.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.747,8.25h-1.497c-1.105,0-2-.895-2-2V3.75c0-1.105,.895-2,2-2H13.75c1.105,0,2,.895,2,2v2.5c0,1.105-.895,2-2,2h-1.667"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25 15.25L8.25 5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.166 13.805L10.055 9.401"
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

export default coupon;

import React from 'react';

import type { iconProps } from './iconProps';

function caretUpRightDownLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret up right down left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.795,2.042l-1.969,2.807c-.116,.166,.002,.394,.205,.394h3.938c.202,0,.321-.228,.205-.394l-1.969-2.807c-.1-.142-.31-.142-.409,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.958,8.795l-2.807-1.969c-.166-.116-.394,.002-.394,.205v3.938c0,.202,.228,.321,.394,.205l2.807-1.969c.142-.1,.142-.31,0-.409Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.205,15.958l1.969-2.807c.116-.166-.002-.394-.205-.394h-3.938c-.202,0-.321,.228-.205,.394l1.969,2.807c.1,.142,.31,.142,.409,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.042,9.205l2.807,1.969c.166,.116,.394-.002,.394-.205v-3.938c0-.202-.228-.321-.394-.205l-2.807,1.969c-.142,.1-.142,.31,0,.409Z"
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

export default caretUpRightDownLeft;

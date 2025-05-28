import React from 'react';

import type { iconProps } from './iconProps';

function circleCaretRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle caret right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.157,8.379l-2.987-2.022c-.498-.337-1.17,.02-1.17,.621v4.044c0,.601,.672,.958,1.17,.621l2.987-2.022c.439-.297,.439-.945,0-1.242Z"
          fill="currentColor"
        />
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default circleCaretRight;

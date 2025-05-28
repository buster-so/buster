import React from 'react';

import type { iconProps } from './iconProps';

function chatBubbleFlag(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chat bubble flag';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.75 16.25L12.75 12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,7.25v-2.5c0-1.104-.895-2-2-2H4.25c-1.105,0-2,.896-2,2v11.5l3.75-3h4.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3"
          width="4.5"
          fill="none"
          rx=".5"
          ry=".5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="12.75"
          y="9.75"
        />
      </g>
    </svg>
  );
}

export default chatBubbleFlag;

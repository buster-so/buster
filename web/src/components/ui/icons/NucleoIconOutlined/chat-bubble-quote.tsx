import React from 'react';

import type { iconProps } from './iconProps';

function chatBubbleQuote(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chat bubble quote';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.75,2.75H4.25c-1.105,0-2,.895-2,2v11.5l3.75-3h7.75c1.105,0,2-.895,2-2V4.75c0-1.105-.895-2-2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,8.75h2v1.5h-2v-1.5c0-1.793,.598-2.582,1.674-3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.25,8.75h2v1.5h-2v-1.5c0-1.793,.598-2.582,1.674-3"
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

export default chatBubbleQuote;

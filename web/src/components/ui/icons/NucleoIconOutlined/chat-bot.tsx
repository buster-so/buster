import React from 'react';

import type { iconProps } from './iconProps';

function chatBot(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chat bot';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.75,.75h-4.5c-.827,0-1.5,.673-1.5,1.5v2c0,.827,.673,1.5,1.5,1.5h.5v2l2.227-2h1.773c.827,0,1.5-.673,1.5-1.5V2.25c0-.827-.673-1.5-1.5-1.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,8.25v6c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2v-5.5c0-1.105,.895-2,2-2h4.38"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.5,12h2c.276,0,.5,.224,.5,.5h0c0,.828-.672,1.5-1.5,1.5h0c-.828,0-1.5-.672-1.5-1.5h0c0-.276,.224-.5,.5-.5Z"
          fill="currentColor"
        />
        <path
          d="M5.25 3.75L5.25 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.5" cy="11" fill="currentColor" r="1" />
        <circle cx="11.5" cy="11" fill="currentColor" r="1" />
        <circle cx="5.25" cy="2.5" fill="currentColor" r="1.5" />
      </g>
    </svg>
  );
}

export default chatBot;

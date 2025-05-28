import React from 'react';

import type { iconProps } from './iconProps';

function chats(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chats';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.25,6.25h5.5c.828,0,1.5,.672,1.5,1.5v8.5s-2.75-2.5-2.75-2.5h-4.25c-.828,0-1.5-.672-1.5-1.5V7.75c0-.828,.672-1.5,1.5-1.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.937,3.75c-.222-.862-1.005-1.5-1.937-1.5H3.75c-1.105,0-2,.895-2,2V13.75s2.75-2.5,2.75-2.5h.75"
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

export default chats;

import React from 'react';

import type { iconProps } from './iconProps';

function stamp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stamp';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75 15.75L14.25 15.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.27,9.75h-4.02s1-5.505,1-5.75c0-1.243-1.007-2.25-2.25-2.25s-2.25,1.007-2.25,2.25c0,.245,1,5.75,1,5.75H3.73c-.913,0-1.614,.808-1.485,1.712l.255,1.788H15.5l.255-1.788c.129-.904-.572-1.712-1.485-1.712Z"
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

export default stamp;

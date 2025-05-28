import React from 'react';

import type { iconProps } from './iconProps';

function folder4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folder 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.25,5.25c0-.552-.448-1-1-1h-6l-.956-1.53c-.183-.292-.503-.47-.848-.47H3.75c-.552,0-1,.448-1,1v2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.918,7.75H15.082c.614,0,1.083,.548,.988,1.154l-.938,6c-.076,.487-.495,.846-.988,.846H3.856c-.493,0-.912-.359-.988-.846l-.938-6c-.095-.606,.374-1.154,.988-1.154Z"
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

export default folder4;

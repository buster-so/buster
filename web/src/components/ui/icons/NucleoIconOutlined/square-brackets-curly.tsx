import React from 'react';

import type { iconProps } from './iconProps';

function squareBracketsCurly(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square brackets curly';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="12.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="2.75"
        />
        <path
          d="M7.25,12.75c-.552,0-1-.448-1-1v-.789c0-.608-.276-1.182-.751-1.562l-.499-.4,.499-.4c.474-.38,.751-.954,.751-1.562v-.789c0-.552,.448-1,1-1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,12.75c.552,0,1-.448,1-1v-.789c0-.608,.276-1.182,.751-1.562l.499-.4-.499-.4c-.474-.38-.751-.954-.751-1.562v-.789c0-.552-.448-1-1-1"
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

export default squareBracketsCurly;

import React from 'react';

import type { iconProps } from './iconProps';

function folderContent(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folder content';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.629,3.75h6.121c1.105,0,2,.895,2,2v1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.124,6.25h5.126c1.105,0,2,.895,2,2v4.5c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2h2.125c.699,0,1.347,.365,1.71,.963l1.539,2.537Z"
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

export default folderContent;

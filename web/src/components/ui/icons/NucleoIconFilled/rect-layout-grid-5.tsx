import React from 'react';

import type { iconProps } from './iconProps';

function rectLayoutGrid5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rect layout grid 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M7,8.25h10v-3.5c0-1.517-1.233-2.75-2.75-2.75H7v6.25Z" fill="currentColor" />
        <path d="M7 9.75H11V16H7z" fill="currentColor" />
        <path
          d="M12.5,9.75v6.25h1.75c1.517,0,2.75-1.233,2.75-2.75v-3.5h-4.5Z"
          fill="currentColor"
        />
        <path
          d="M5.5,2h-1.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h1.75V2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default rectLayoutGrid5;

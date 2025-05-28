import React from 'react';

import type { iconProps } from './iconProps';

function cloudSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.922,5.078c-.761-1.387-2.226-2.328-3.922-2.328-2.485,0-4.5,2.015-4.5,4.5,0,.35,.049,.686,.124,1.013-1.597,.067-2.874,1.374-2.874,2.987,0,1.354,.897,2.498,2.129,2.871"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.156,14.25h5.344c2.071,0,3.75-1.679,3.75-3.75,0-1.386-.755-2.586-1.874-3.232"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L16 2"
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

export default cloudSlash;

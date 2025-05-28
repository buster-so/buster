import React from 'react';

import type { iconProps } from './iconProps';

function folderBookmark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folder bookmark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.25,8.75V4.75c0-1.105,.895-2,2-2h1.951c.607,0,1.18,.275,1.56,.748l.603,.752h5.386c1.105,0,2,.895,2,2v2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.679,8.25c-.223-.861-.998-1.5-1.929-1.5H4.25c-1.105,0-2,.896-2,2v4.5c0,1.104,.895,2,2,2h6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.25,17.25l-2.25-2.25-2.25,2.25v-5.5c0-.552,.448-1,1-1h2.5c.552,0,1,.448,1,1v5.5Z"
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

export default folderBookmark;

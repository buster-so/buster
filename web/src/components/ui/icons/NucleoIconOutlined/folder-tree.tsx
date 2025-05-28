import React from 'react';

import type { iconProps } from './iconProps';

function folderTree(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folder tree';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.123,2.75h2.127c.552,0,1,.448,1,1v2.5c0,.552-.448,1-1,1h-4.5c-.552,0-1-.448-1-1V2.75c0-.552,.448-1,1-1h1.046c.289,0,.563,.125,.753,.342l.575,.658Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.123,11.75h2.127c.552,0,1,.448,1,1v2.5c0,.552-.448,1-1,1h-4.5c-.552,0-1-.448-1-1v-3.5c0-.552,.448-1,1-1h1.046c.289,0,.563,.125,.753,.342l.575,.658Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,4.75h-2c-.828,0-1.5-.672-1.5-1.5V1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,13.75h-2c-.828,0-1.5-.672-1.5-1.5V3"
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

export default folderTree;

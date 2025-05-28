import React from 'react';

import type { iconProps } from './iconProps';

function table(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M6.5,6h10.5v-1.25c0-1.517-1.233-2.75-2.75-2.75H6.5V6Z" fill="currentColor" />
        <path d="M1 7.5H5V10.5H1z" fill="currentColor" />
        <path d="M6.5 7.5H17V10.5H6.5z" fill="currentColor" />
        <path d="M6.5,12v4h7.75c1.517,0,2.75-1.233,2.75-2.75v-1.25H6.5Z" fill="currentColor" />
        <path d="M5,12H1v1.25c0,1.517,1.233,2.75,2.75,2.75h1.25v-4Z" fill="currentColor" />
        <path d="M5,6V2h-1.25c-1.517,0-2.75,1.233-2.75,2.75v1.25H5Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default table;

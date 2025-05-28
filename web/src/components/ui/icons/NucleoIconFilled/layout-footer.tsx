import React from 'react';

import type { iconProps } from './iconProps';

function layoutFooter(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px layout footer';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,13h-1.5V4.75c0-.689-.561-1.25-1.25-1.25H3.75c-.689,0-1.25,.561-1.25,1.25V13H1V4.75c0-1.517,1.233-2.75,2.75-2.75H14.25c1.517,0,2.75,1.233,2.75,2.75V13Z"
          fill="currentColor"
        />
        <rect height="6" width="16" fill="currentColor" rx="2.75" ry="2.75" x="1" y="10" />
      </g>
    </svg>
  );
}

export default layoutFooter;

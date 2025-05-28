import React from 'react';

import type { iconProps } from './iconProps';

function layoutHeader(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px layout header';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,16H3.75c-1.517,0-2.75-1.234-2.75-2.75V5.396h1.5v7.854c0,.689,.561,1.25,1.25,1.25H14.25c.689,0,1.25-.561,1.25-1.25V5.396h1.5v7.854c0,1.516-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
        />
        <rect height="6" width="16" fill="currentColor" rx="2.75" ry="2.75" x="1" y="2" />
      </g>
    </svg>
  );
}

export default layoutHeader;

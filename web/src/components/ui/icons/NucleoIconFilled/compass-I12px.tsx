import React from 'react';

import type { iconProps } from './iconProps';

function compass(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px compass';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm4.225,4.76l-1.806,4.214c-.28,.652-.793,1.165-1.444,1.444l-4.215,1.807c-.095,.041-.196,.061-.295,.061-.195,0-.387-.076-.53-.22-.217-.217-.28-.544-.159-.826l1.806-4.214c.28-.652,.793-1.165,1.444-1.444l4.215-1.807c.282-.119,.609-.058,.826,.159,.217,.217,.28,.544,.159,.826Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default compass;

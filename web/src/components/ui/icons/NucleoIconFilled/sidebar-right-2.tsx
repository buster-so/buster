import React from 'react';

import type { iconProps } from './iconProps';

function sidebarRight2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sidebar right 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m3.75,2h10.5c1.5166,0,2.75,1.2334,2.75,2.75v8.5c0,1.5166-1.2334,2.75-2.75,2.75H3.75c-1.5166,0-2.75-1.2334-2.75-2.75V4.75c0-1.5166,1.2334-2.75,2.75-2.75Zm10.5,12.5c.6895,0,1.25-.5605,1.25-1.25V4.75c0-.6895-.5605-1.25-1.25-1.25H3.75c-.6895,0-1.25.5605-1.25,1.25v8.5c0,.6895.5605,1.25,1.25,1.25h10.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.25,5h3c.4141,0,.75.3359.75.75v6.5c0,.4141-.3359.75-.75.75h-3c-.4141,0-.75-.3359-.75-.75v-6.5c0-.4141.3359-.75.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default sidebarRight2;

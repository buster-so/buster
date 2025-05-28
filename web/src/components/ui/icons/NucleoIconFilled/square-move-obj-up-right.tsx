import React from 'react';

import type { iconProps } from './iconProps';

function squareMoveObjUpRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square move obj up right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m13.25,2H4.75c-1.5166,0-2.75,1.2334-2.75,2.75v8.5c0,1.5166,1.2334,2.75,2.75,2.75h8.5c1.5166,0,2.75-1.2334,2.75-2.75V4.75c0-1.5166-1.2334-2.75-2.75-2.75Zm-4.25,11c0,.5522-.4477,1-1,1h-3c-.5523,0-1-.4478-1-1v-3c0-.5522.4477-1,1-1h3c.5523,0,1,.4478,1,1v3Zm5-5c0,.4141-.3359.75-.75.75s-.75-.3359-.75-.75v-1.4395l-1.7197,1.7197c-.1465.1465-.3384.2197-.5303.2197s-.3838-.0732-.5303-.2197c-.293-.293-.293-.7676,0-1.0605l1.7197-1.7197h-1.4395c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h3.25c.4141,0,.75.3359.75.75v3.25Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default squareMoveObjUpRight;

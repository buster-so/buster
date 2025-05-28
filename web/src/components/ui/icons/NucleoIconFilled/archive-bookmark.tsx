import React from 'react';

import type { iconProps } from './iconProps';

function archiveBookmark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px archive bookmark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m15.25,9.5h-3.5c-.4141,0-.75.3359-.75.75v1.5c0,.1377-.1123.25-.25.25h-3.5c-.1377,0-.25-.1123-.25-.25v-1.5c0-.4141-.3359-.75-.75-.75h-2.75v-4.75c0-.6895.5605-1.25,1.25-1.25h4.5c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75h-4.5c-1.5166,0-2.75,1.2334-2.75,2.75v8.5c0,1.5166,1.2334,2.75,2.75,2.75h8.5c1.5166,0,2.75-1.2334,2.75-2.75v-3c0-.4141-.3359-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m15.25,0h-2.5c-.9648,0-1.75.7852-1.75,1.75v5.5c0,.3032.1826.5767.4629.6929.2803.1167.6025.0518.8174-.1626l1.7197-1.7197,1.7197,1.7197c.1436.1436.335.2197.5303.2197.0967,0,.1943-.0186.2871-.0571.2803-.1162.4629-.3896.4629-.6929V1.75c0-.9648-.7852-1.75-1.75-1.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default archiveBookmark;

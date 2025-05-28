import React from 'react';

import type { iconProps } from './iconProps';

function archiveClock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px archive clock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m15.25,9.5h-3.5c-.4141,0-.75.3359-.75.75v1.5c0,.1377-.1123.25-.25.25h-3.5c-.1377,0-.25-.1123-.25-.25v-1.5c0-.4141-.3359-.75-.75-.75h-2.75v-4.75c0-.6895.5605-1.25,1.25-1.25h3.4556c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75h-3.4556c-1.5161,0-2.75,1.2334-2.75,2.75v8.5c0,1.5166,1.2334,2.75,2.75,2.75h8.5c1.5166,0,2.75-1.2334,2.75-2.75v-3c0-.4141-.3359-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m13.75.25c-2.2061,0-4,1.7944-4,4s1.7939,4,4,4,4-1.7944,4-4S15.9561.25,13.75.25Zm2.3125,4.9502c-.1191.2896-.3984.4648-.6934.4648-.0957,0-.1914-.0181-.2852-.0562l-1.6191-.665c-.2812-.1157-.4648-.3896-.4648-.6938v-1.75c0-.4141.3359-.75.75-.75s.75.3359.75.75v1.2471l1.1543.4741c.3828.1572.5664.5957.4082.979Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default archiveClock;

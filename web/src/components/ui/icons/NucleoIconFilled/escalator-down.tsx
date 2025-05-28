import React from 'react';

import type { iconProps } from './iconProps';

function escalatorDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px escalator down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6.5,5c-1.1027,0-2-.8973-2-2s.8973-2,2-2,2,.8973,2,2-.8973,2-2,2Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m16.25,15.5098h-1.6992l2.2197-2.2197c.293-.293.293-.7676,0-1.0605s-.7676-.293-1.0605,0l-2.2197,2.2197v-1.6992c0-.4141-.3359-.75-.75-.75s-.75.3359-.75.75v3.5098c0,.4141.3359.75.75.75h3.5098c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.3633,10.5l3.9614-3.697c-.4568-.491-1.1028-.803-1.8246-.803-1.3784,0-2.5,1.1216-2.5,2.5v2h.3633Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m17.501,7.5h0c0-1.3807-1.1193-2.5-2.5-2.5h-1.4624c-.6962,0-1.3664.2642-1.8753.7391l-6.7087,6.2609h-1.9546c-1.3807,0-2.5,1.1193-2.5,2.5h0c0,1.3807,1.1193,2.5,2.5,2.5h1.4621c.6967,0,1.3674-.2644,1.8768-.7397l6.7075-6.2603h1.9546c1.3807,0,2.5-1.1193,2.5-2.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default escalatorDown;

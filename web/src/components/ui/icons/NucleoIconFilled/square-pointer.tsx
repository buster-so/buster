import React from 'react';

import type { iconProps } from './iconProps';

function squarePointer(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square pointer';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.959,16h-4.209c-1.5166,0-2.75-1.2334-2.75-2.75V4.75c0-1.5166,1.2334-2.75,2.75-2.75h8.5c1.5166,0,2.75,1.2334,2.75,2.75v4.209c0,.4141-.3359.75-.75.75s-.75-.3359-.75-.75v-4.209c0-.6895-.5605-1.25-1.25-1.25H4.75c-.6895,0-1.25.5605-1.25,1.25v8.5c0,.6895.5605,1.25,1.25,1.25h4.209c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m17.2959,11.5693l-6.8545-2.5039c-.3965-.1436-.8271-.0493-1.126.248-.2988.2983-.3945.7295-.25,1.1279l2.5049,6.8535c.1543.4243.5576.7056,1.0068.7056.0078,0,.0146-.0005.0215-.0005.459-.0093.8604-.3086,1-.7456l.8867-2.7686,2.7705-.8872c.4355-.1396.7344-.5415.7441-.9995s-.2734-.8716-.7041-1.0298Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default squarePointer;

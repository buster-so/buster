import React from 'react';

import type { iconProps } from './iconProps';

function album(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px album';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.75 1.75L4.25 1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.448,4.75H14.552c.624,0,1.095,.565,.984,1.179l-1.636,9c-.086,.475-.501,.821-.984,.821H5.085c-.483,0-.897-.346-.984-.821L2.464,5.929c-.112-.614,.36-1.179,.984-1.179Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default album;

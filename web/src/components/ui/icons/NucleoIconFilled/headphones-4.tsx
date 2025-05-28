import React from 'react';

import type { iconProps } from './iconProps';

function headphones4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px headphones 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m15.75,13.5c-.4141,0-.75-.3359-.75-.75v-3.75c0-3.3086-2.6914-6-6-6s-6,2.6914-6,6v3.75c0,.4141-.3359.75-.75.75s-.75-.3359-.75-.75v-3.75C1.5,4.8643,4.8643,1.5,9,1.5s7.5,3.3643,7.5,7.5v3.75c0,.4141-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m5.25,9c-2.0679,0-3.75,1.6821-3.75,3.75s1.6821,3.75,3.75,3.75c.9648,0,1.75-.7852,1.75-1.75v-4c0-.9648-.7852-1.75-1.75-1.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m12.75,9c-.9648,0-1.75.7852-1.75,1.75v4c0,.9648.7852,1.75,1.75,1.75,2.0679,0,3.75-1.6821,3.75-3.75s-1.6821-3.75-3.75-3.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default headphones4;

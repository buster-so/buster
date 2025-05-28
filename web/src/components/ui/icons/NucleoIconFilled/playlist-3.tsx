import React from 'react';

import type { iconProps } from './iconProps';

function playlist3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px playlist 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.25,2h-4.5c-1.5166,0-2.75,1.2334-2.75,2.75v8.5c0,1.5166,1.2334,2.75,2.75,2.75h4.5c1.5166,0,2.75-1.2334,2.75-2.75V4.75c0-1.5166-1.2334-2.75-2.75-2.75Zm-.5402,7.5166l-2.2964,1.3853c-.402.2424-.9147-.0471-.9147-.5166v-2.7705c0-.4695.5128-.759.9147-.5166l2.2964,1.3853c.3888.2346.3888.7986,0,1.0332Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m16.25,14.5c-.4141,0-.75-.3359-.75-.75V4.25c0-.4141.3359-.75.75-.75s.75.3359.75.75v9.5c0,.4141-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m1.75,14.5c-.4141,0-.75-.3359-.75-.75V4.25c0-.4141.3359-.75.75-.75s.75.3359.75.75v9.5c0,.4141-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default playlist3;

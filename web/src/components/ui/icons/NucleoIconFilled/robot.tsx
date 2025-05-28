import React from 'react';

import type { iconProps } from './iconProps';

function robot(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px robot';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m2.75,12.5h-1.75c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h1.75c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m17,12.5h-1.75c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h1.75c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.25,2.25c0-1.2407-1.0098-2.25-2.25-2.25s-2.25,1.0093-2.25,2.25c0,.9763.6291,1.8013,1.5,2.1118v2.3882c0,.4141.3359.75.75.75s.75-.3359.75-.75v-2.3882c.8709-.3105,1.5-1.1355,1.5-2.1118Zm-2.25.75c-.4131,0-.75-.3364-.75-.75s.3369-.75.75-.75.75.3364.75.75-.3369.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m13.25,6H4.75c-1.5166,0-2.75,1.2334-2.75,2.75v5.5c0,1.5166,1.2334,2.75,2.75,2.75h8.5c1.5166,0,2.75-1.2334,2.75-2.75v-5.5c0-1.5166-1.2334-2.75-2.75-2.75Zm-7.75,6c-.5523,0-1-.4478-1-1s.4477-1,1-1,1,.4478,1,1-.4477,1-1,1Zm3.5,2c-.828,0-1.5-.6719-1.5-1.5,0-.2759.224-.5.5-.5h2c.276,0,.5.2241.5.5,0,.8281-.672,1.5-1.5,1.5Zm3.5-2c-.5523,0-1-.4478-1-1s.4477-1,1-1,1,.4478,1,1-.4477,1-1,1Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default robot;
